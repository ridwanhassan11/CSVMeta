import { Redis } from "@upstash/redis";

let cachedClient: Redis | null | undefined;

function cleanEnvValue(value?: string) {
  return (value || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\/+$/, "");
}

export function getRedisConfigStatus() {
  const rawUrl = cleanEnvValue(
    process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_URL ||
      process.env.REDIS_URL
  );
  let url = rawUrl;
  let token = cleanEnvValue(
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  );
  let host = "";
  let protocol = "";

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      protocol = parsed.protocol;
      host = parsed.hostname;
      // If a redis:// or rediss:// TCP URL was provided, map to Upstash HTTPS REST endpoint
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
