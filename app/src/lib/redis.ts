import { Redis } from "@upstash/redis";

let cachedClient: Redis | null | undefined;

function cleanEnvValue(value?: string) {
  return (value || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\/+$/, "");
}

export function getRedisConfigStatus() {
  const upstashUrl = cleanEnvValue(process.env.UPSTASH_REDIS_REST_URL);
  const upstashToken = cleanEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN);
  const kvUrl = cleanEnvValue(process.env.KV_REST_API_URL);
  const kvToken = cleanEnvValue(process.env.KV_REST_API_TOKEN);
  const fallbackUrl = cleanEnvValue(process.env.KV_URL || process.env.REDIS_URL);

  let rawUrl = "";
  let token = "";
  if (upstashUrl && upstashToken) {
    rawUrl = upstashUrl;
    token = upstashToken;
  } else if (kvUrl || kvToken) {
    rawUrl = kvUrl;
    token = kvToken;
  } else {
    rawUrl = fallbackUrl;
  }

  let url = rawUrl;
  let host = "";
  let protocol = "";

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
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
      // Keep rawUrl so diagnostics report invalid format
    }
  }

  return {
    hasUrl: Boolean(url),
    hasToken: Boolean(token),
    configured: Boolean(url && token),
    url,
    token,
    host,
    protocol,
  };
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
