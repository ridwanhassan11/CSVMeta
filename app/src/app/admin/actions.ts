"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { ensureLiveRedis, getRedis, getRedisConfigStatus } from "@/lib/redis";
import { normalizeEmail } from "@/lib/userTracking";

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
  signedIn: boolean;
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
  host?: string;
  protocol?: string;
  error?: string;
};

function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err || "Unknown error");
  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    const c = cause as { code?: string; message?: string; hostname?: string };
    const details = [c.code, c.hostname, c.message].filter(Boolean).join(" · ");
    if (details) return `${err.message} (${details})`;
  }
  return err.message;
}

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
  const uniqueEmails = Array.from(
    new Set(
      (Array.isArray(rawEmails) ? rawEmails : [])
        .map((e) => normalizeEmail(String(e || "")))
        .filter(Boolean)
    )
  );
  if (uniqueEmails.length === 0) return [];

  const records = await fetchUserRecords(uniqueEmails);
  const now = Date.now();

  const users: UserRecord[] = uniqueEmails.map((email, i) => {
    const data = records[i];
    const lastActiveStr = typeof data?.lastActive === "string" ? data.lastActive : undefined;
    const lastSignInStr = typeof data?.lastSignIn === "string" ? data.lastSignIn : undefined;
    const lastSignOutStr = typeof data?.lastSignOut === "string" ? data.lastSignOut : undefined;

    const lastActiveMs = lastActiveStr ? new Date(lastActiveStr).getTime() : NaN;
    const lastSignInMs = lastSignInStr ? new Date(lastSignInStr).getTime() : NaN;
    const lastSignOutMs = lastSignOutStr ? new Date(lastSignOutStr).getTime() : NaN;

    const explicitlySignedOut = String(data?.isSignedIn || "") === "false";
    const signedOutAfterLastActivity =
      Number.isFinite(lastSignOutMs) &&
      (!Number.isFinite(lastActiveMs) || lastSignOutMs >= lastActiveMs) &&
      (!Number.isFinite(lastSignInMs) || lastSignOutMs >= lastSignInMs);

    const signedIn = !explicitlySignedOut && !signedOutAfterLastActivity && Boolean(lastSignInStr || lastActiveStr);
    const online =
      signedIn && Number.isFinite(lastActiveMs) && now - lastActiveMs < ONLINE_WINDOW_MS;

    const count = Number(data?.signInCount || 0);
    return {
      email,
      name: typeof data?.name === "string" ? data.name : "",
      image: typeof data?.image === "string" ? data.image : "",
      location: typeof data?.location === "string" ? data.location : "",
      lastSignIn: lastSignInStr,
      lastSignOut: lastSignOutStr,
      lastActive: lastActiveStr,
      signInCount: Number.isFinite(count) ? count : 0,
      signedIn,
      online,
      blocked: String(data?.blocked || "") === "true",
      approved: String(data?.approved || "") !== "false",
    };
  });

  return users.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.signedIn !== b.signedIn) return a.signedIn ? -1 : 1;
    return (b.lastActive || b.lastSignIn || b.lastSignOut || "").localeCompare(
      a.lastActive || a.lastSignIn || a.lastSignOut || ""
    );
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
  const redis = await ensureLiveRedis();
  const cfg = getRedisConfigStatus();

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
        host: cfg.host,
        protocol: cfg.protocol,
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
        host: cfg.host,
        protocol: cfg.protocol,
      },
    };
  } catch (err: unknown) {
    let msg = describeError(err);
    try {
      const probe = await fetch(`${cfg.url}/ping`, {
        headers: { Authorization: `Bearer ${cfg.token}` },
        cache: "no-store",
      });
      if (!probe.ok) {
        msg = `${msg} · HTTP ${probe.status} ${probe.statusText}`;
      }
    } catch (probeErr: unknown) {
      msg = describeError(probeErr);
    }

    console.error("Admin snapshot failed:", msg);
    return {
      users: [],
      activity: [],
      requireApproval: false,
      redisStatus: {
        ok: false,
        configured: true,
        hasUrl: cfg.hasUrl,
        hasToken: cfg.hasToken,
        host: cfg.host,
        protocol: cfg.protocol,
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

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;
  if (blocked && isAdminEmail(cleanEmail)) {
    throw new Error(
      "এটি আপনার হোস্ট অ্যাডমিন ইমেইল—অ্যাডমিন অ্যাকাউন্ট ব্লক করা যাবে না। ব্লক টেস্ট করতে অন্য একটি সাধারণ জিমেইল ব্যবহার করুন।"
    );
  }
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

  const cleanEmail = normalizeEmail(email);
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

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;
  await redis.del(`user:${cleanEmail}`);
  await redis.del(`activity:${cleanEmail}`);
  await redis.srem("all_users", cleanEmail);
  revalidatePath("/admin");
}

export async function getUserActivity(email: string): Promise<ActivityEntry[]> {
  await assertAdmin();
  const redis = getRedis();
  const cleanEmail = normalizeEmail(email);
  if (!redis || !cleanEmail) return [];

  try {
    const raw = await redis.lrange(`activity:${cleanEmail}`, 0, 49);
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
