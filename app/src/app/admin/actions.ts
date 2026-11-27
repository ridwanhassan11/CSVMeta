"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getRedis, getRedisConfigStatus } from "@/lib/redis";

const ONLINE_WINDOW_MS = 120_000;

async function assertAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("Unauthorized");
  }
}

export type UserRecord = {
  email: string;
  name: string;
  image: string;
  location?: string;
  lastSignIn?: string;
  lastSignOut?: string;
  lastActive?: string;
  signInCount: number;
  online: boolean;
  blocked: boolean;
  approved: boolean;
};

export type ActivityEntry = {
  type: "signin" | "signout";
  email?: string;
  at: string;
};

export type RedisStatus = {
  ok: boolean;
  configured: boolean;
  hasUrl: boolean;
  hasToken: boolean;
  error?: string;
};

async function fetchUserRecords(emails: string[]): Promise<Array<Record<string, string> | null>> {
  const redis = getRedis();
  if (!redis || emails.length === 0) return [];

  try {
    const pipe = redis.pipeline();
    for (const email of emails) {
      pipe.hgetall(`user:${email}`);
    }
    const execResult = await pipe.exec();
    if (Array.isArray(execResult) && execResult.length === emails.length) {
      return execResult as Array<Record<string, string> | null>;
    }
  } catch {
    // Fallback below if pipeline fails in any environment
  }

  return Promise.all(
    emails.map(async (email) => {
      try {
        return (await redis.hgetall(`user:${email}`)) as Record<string, string> | null;
      } catch {
        return null;
      }
    })
  );
}

export async function getAllUsers(): Promise<UserRecord[]> {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) return [];

  const rawEmails = await redis.smembers("all_users");
  const emails = Array.isArray(rawEmails)
    ? rawEmails.map((e) => String(e || "").trim()).filter(Boolean)
    : [];
  if (emails.length === 0) return [];

  const records = await fetchUserRecords(emails);
  const now = Date.now();

  const users: UserRecord[] = emails.map((email, i) => {
    const data = records[i];
    const lastActiveStr = typeof data?.lastActive === "string" ? data.lastActive : undefined;
    const lastActiveMs = lastActiveStr ? new Date(lastActiveStr).getTime() : NaN;
    const count = Number(data?.signInCount || 0);
    return {
      email,
      name: typeof data?.name === "string" ? data.name : "",
      image: typeof data?.image === "string" ? data.image : "",
      location: typeof data?.location === "string" ? data.location : "",
      lastSignIn: typeof data?.lastSignIn === "string" ? data.lastSignIn : undefined,
      lastSignOut: typeof data?.lastSignOut === "string" ? data.lastSignOut : undefined,
      lastActive: lastActiveStr,
      signInCount: Number.isFinite(count) ? count : 0,
      online: Number.isFinite(lastActiveMs) && now - lastActiveMs < ONLINE_WINDOW_MS,
      blocked: String(data?.blocked || "") === "true",
      approved: String(data?.approved || "") !== "false",
    };
  });

  return users.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return (b.lastActive || b.lastSignIn || "").localeCompare(a.lastActive || a.lastSignIn || "");
  });
}

export async function getApprovalMode(): Promise<boolean> {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) return false;

  const siteSettings = (await redis.hgetall("site_settings")) as Record<string, string> | null;
  return siteSettings?.requireApproval === "true";
}

export async function getGlobalActivity(): Promise<ActivityEntry[]> {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) return [];

  const raw = await redis.lrange("activity_log", 0, 99);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? (JSON.parse(r) as ActivityEntry) : (r as ActivityEntry);
      } catch {
        return null;
      }
    })
    .filter((entry): entry is ActivityEntry => Boolean(entry && entry.at));
}

export async function getAdminSnapshot(): Promise<{
  users: UserRecord[];
  activity: ActivityEntry[];
  requireApproval: boolean;
  redisStatus: RedisStatus;
}> {
  await assertAdmin();
  const cfg = getRedisConfigStatus();
  const redis = getRedis();

  if (!redis || !cfg.configured) {
    return {
      users: [],
      activity: [],
      requireApproval: false,
      redisStatus: {
        ok: false,
        configured: false,
        hasUrl: cfg.hasUrl,
        hasToken: cfg.hasToken,
        error: "Upstash Redis এনভায়রনমেন্ট ভ্যারিয়েবল (KV_REST_API_URL / KV_REST_API_TOKEN) Vercel-এ সেট করা নেই।",
      },
    };
  }

  try {
    const [users, activity, requireApproval] = await Promise.all([
      getAllUsers(),
      getGlobalActivity(),
      getApprovalMode(),
    ]);
    return {
      users,
      activity,
      requireApproval,
      redisStatus: {
        ok: true,
        configured: true,
        hasUrl: cfg.hasUrl,
        hasToken: cfg.hasToken,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Redis connection error";
    console.error("Admin snapshot failed:", err);
    return {
      users: [],
      activity: [],
      requireApproval: false,
      redisStatus: {
        ok: false,
        configured: true,
        hasUrl: cfg.hasUrl,
        hasToken: cfg.hasToken,
        error: msg,
      },
    };
  }
}

export async function setApprovalMode(requireApproval: boolean) {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured in Vercel environment variables.");

  await redis.hset("site_settings", {
    requireApproval: requireApproval ? "true" : "false",
  });
  revalidatePath("/admin");
}

export async function toggleBlockUser(email: string, blocked: boolean) {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured in Vercel environment variables.");

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return;
  await redis.sadd("all_users", cleanEmail);
  await redis.hset(`user:${cleanEmail}`, {
    email: cleanEmail,
    blocked: blocked ? "true" : "false",
  });
  revalidatePath("/admin");
}

export async function setUserApproval(email: string, approved: boolean) {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured in Vercel environment variables.");

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return;
  await redis.sadd("all_users", cleanEmail);
  await redis.hset(`user:${cleanEmail}`, {
    email: cleanEmail,
    approved: approved ? "true" : "false",
    ...(approved ? { blocked: "false" } : {}),
  });
  revalidatePath("/admin");
}

export async function deleteUserAccount(email: string) {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured in Vercel environment variables.");

  await redis.del(`user:${email}`);
  await redis.del(`activity:${email}`);
  await redis.srem("all_users", email);
  revalidatePath("/admin");
}

export async function getUserActivity(email: string): Promise<ActivityEntry[]> {
  await assertAdmin();
  const redis = getRedis();
  if (!redis) return [];

  try {
    const raw = await redis.lrange(`activity:${email}`, 0, 49);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r) => {
        try {
          return typeof r === "string" ? (JSON.parse(r) as ActivityEntry) : (r as ActivityEntry);
        } catch {
          return null;
        }
      })
      .filter((entry): entry is ActivityEntry => Boolean(entry && entry.at));
  } catch {
    return [];
  }
}

export async function updateHeartbeat(email: string, location?: string) {
  const redis = getRedis();
  if (!redis) return;

  const update: Record<string, string> = {
    lastActive: new Date().toISOString(),
  };
  if (location) update.location = location;

  try {
    await redis.hset(`user:${email}`, update);
  } catch (err) {
    console.error("heartbeat update failed:", err);
  }
}
