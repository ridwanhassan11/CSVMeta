import { Redis } from "@upstash/redis";

type RedisCandidate = {
  sourceKey: string;
  url: string;
  token: string;
  host: string;
  protocol: string;
};

let cachedClient: Redis | null | undefined;
let cachedCandidate: RedisCandidate | null | undefined;
let probeDone = false;

function cleanEnvValue(value?: string) {
  return (value || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\/+$/, "");
}

function parseCandidate(sourceKey: string, rawUrl: string, rawToken: string): RedisCandidate | null {
  const urlStr = cleanEnvValue(rawUrl);
  let token = cleanEnvValue(rawToken);
  if (!urlStr) return null;

  let url = urlStr;
  let host = "";
  let protocol = "";

  try {
    const parsed = new URL(urlStr);
    protocol = parsed.protocol;
    host = parsed.hostname;
    if ((parsed.protocol === "redis:" || parsed.protocol === "rediss:") && parsed.hostname) {
      url = `https://${parsed.hostname}`;
      protocol = "https:";
      if (!token && parsed.password) {
        token = decodeURIComponent(parsed.password);
      }
    }
  } catch {
    // Keep raw urlStr for diagnostic reporting
  }

  if (!token) return null;
  return { sourceKey, url, token, host, protocol };
}

export function getRedisCandidates(): RedisCandidate[] {
  const list: RedisCandidate[] = [];
  const seen = new Set<string>();

  const pushCandidate = (sourceKey: string, url?: string, token?: string) => {
    if (!url) return;
    const c = parseCandidate(sourceKey, url, token || "");
    if (!c) return;
    const sig = `${c.url}::${c.token}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    list.push(c);
  };

  pushCandidate("UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN);
  pushCandidate("KV_REST_API_URL", process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN);

  // Also scan any custom-prefixed Vercel Storage / Upstash REST vars (e.g. PREFIX_KV_REST_API_URL)
  for (const [key, val] of Object.entries(process.env)) {
    if (!val) continue;
    if (key.endsWith("_REST_API_URL") || key.endsWith("_REDIS_REST_URL")) {
      const tokenKey = key.replace(/_URL$/, "_TOKEN");
      pushCandidate(key, val, process.env[tokenKey]);
    } else if (key.endsWith("_KV_URL") || key.endsWith("_REDIS_URL")) {
      pushCandidate(key, val, "");
    }
  }

  pushCandidate("KV_URL", process.env.KV_URL, "");
  pushCandidate("REDIS_URL", process.env.REDIS_URL, "");

  return list;
}

export function getRedisConfigStatus() {
  if (cachedCandidate) {
    return {
      hasUrl: true,
      hasToken: true,
      configured: true,
      url: cachedCandidate.url,
      token: cachedCandidate.token,
      host: cachedCandidate.host,
      protocol: cachedCandidate.protocol,
      sourceKey: cachedCandidate.sourceKey,
    };
  }

  const first = getRedisCandidates()[0];
  if (first) {
    return {
      hasUrl: true,
      hasToken: true,
      configured: true,
      url: first.url,
      token: first.token,
      host: first.host,
      protocol: first.protocol,
      sourceKey: first.sourceKey,
    };
  }

  const anyUrl = cleanEnvValue(
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL
  );
  const anyToken = cleanEnvValue(
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  );

  return {
    hasUrl: Boolean(anyUrl),
    hasToken: Boolean(anyToken),
    configured: false,
    url: anyUrl,
    token: anyToken,
    host: "",
    protocol: "",
    sourceKey: "",
  };
}

export async function ensureLiveRedis(): Promise<Redis | null> {
  if (probeDone && cachedClient) return cachedClient;

  const candidates = getRedisCandidates();
  if (candidates.length === 0) {
    cachedClient = null;
    cachedCandidate = null;
    probeDone = true;
    return null;
  }

  if (candidates.length === 1) {
    cachedCandidate = candidates[0];
    cachedClient = new Redis({ url: cachedCandidate.url, token: cachedCandidate.token });
    probeDone = true;
    return cachedClient;
  }

  // Test multiple candidates to skip any dead legacy KV endpoint
  for (const c of candidates) {
    try {
      const res = await fetch(`${c.url}/ping`, {
        headers: { Authorization: `Bearer ${c.token}` },
        cache: "no-store",
      });
      if (res.ok) {
        cachedCandidate = c;
        cachedClient = new Redis({ url: c.url, token: c.token });
        probeDone = true;
        return cachedClient;
      }
    } catch {
      // Try next candidate
    }
  }

  cachedCandidate = candidates[0];
  cachedClient = new Redis({ url: cachedCandidate.url, token: cachedCandidate.token });
  probeDone = true;
  return cachedClient;
}

export function getRedis(): Redis | null {
  if (cachedClient !== undefined) return cachedClient;
  const { configured, url, token } = getRedisConfigStatus();
  if (!configured) {
    cachedClient = null;
    return null;
  }
  try {
    cachedClient = new Redis({ url, token });
  } catch {
    cachedClient = null;
  }
  return cachedClient;
}
