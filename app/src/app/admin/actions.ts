"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { redis } from "@/lib/redis";

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

export async function getApprovalMode(): Promise<boolean> {
  await assertAdmin();
  const siteSettings = (await redis.hgetall("site_settings")) as Record<string, string> | null;
  return siteSettings?.requireApproval === "true";
}

export async function setApprovalMode(requireApproval: boolean) {
  await assertAdmin();
  await redis.hset("site_settings", {
    requireApproval: requireApproval ? "true" : "false",
  });
  revalidatePath("/admin");
}

export async function getAllUsers(): Promise<UserRecord[]> {
  await assertAdmin();
  const emails = (await redis.smembers("all_users")) as string[];
  if (!emails || emails.length === 0) return [];

  const pipe = redis.pipeline();
  for (const email of emails) {
    pipe.hgetall(`user:${email}`);
  }
  const records = (await pipe.exec()) as Array<Record<string, string> | null>;

  const now = Date.now();
  const users: UserRecord[] = emails.map((email, i) => {
    const data = records[i];
    const lastActiveTs = data?.lastActive ? new Date(data.lastActive).getTime() : 0;
    const count = Number(data?.signInCount || 0);
    return {
      email,
      name: data?.name || "",
      image: data?.image || "",
      location: data?.location || "",
      lastSignIn: data?.lastSignIn,
      lastSignOut: data?.lastSignOut,
      lastActive: data?.lastActive,
      signInCount: Number.isFinite(count) ? count : 0,
      online: now - lastActiveTs < ONLINE_WINDOW_MS,
      blocked: data?.blocked === "true",
      approved: data?.approved !== "false",
    };
  });

  return users.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return (b.lastActive || b.lastSignIn || "").localeCompare(a.lastActive || a.lastSignIn || "");
  });
}

export async function toggleBlockUser(email: string, blocked: boolean) {
  await assertAdmin();
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
  await redis.del(`user:${email}`);
  await redis.del(`activity:${email}`);
  await redis.srem("all_users", email);
  revalidatePath("/admin");
}

export async function getUserActivity(email: string): Promise<ActivityEntry[]> {
  await assertAdmin();
  const raw = (await redis.lrange(`activity:${email}`, 0, 49)) as Array<string | ActivityEntry>;
  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? (JSON.parse(r) as ActivityEntry) : r;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is ActivityEntry => entry !== null);
}

export async function getGlobalActivity(): Promise<ActivityEntry[]> {
  await assertAdmin();
  const raw = (await redis.lrange("activity_log", 0, 99)) as Array<string | ActivityEntry>;
  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? (JSON.parse(r) as ActivityEntry) : r;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is ActivityEntry => entry !== null);
}

export async function updateHeartbeat(email: string, location?: string) {
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
