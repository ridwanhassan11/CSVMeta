import { Redis } from "@upstash/redis";

let cachedClient: Redis | null | undefined;

export function getRedisConfigStatus() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  return {
    hasUrl: Boolean(url),
    hasToken: Boolean(token),
    configured: Boolean(url && token),
    url,
    token,
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
