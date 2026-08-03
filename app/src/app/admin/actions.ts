"use server";

import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export type UserRecord = {
  email: string;
  name: string;
  image: string;
  lastSignIn?: string;
  lastSignOut?: string;
  blocked: boolean;
};

export type ActivityEntry = {
  type: "signin" | "signout";
  email?: string;
  at: string;
};

export async function getAllUsers(): Promise<UserRecord[]> {
  const emails = (await redis.smembers("all_users")) as string[];
  if (!emails || emails.length === 0) return [];

  const users = await Promise.all(
    emails.map(async (email) => {
      const data = (await redis.hgetall(`user:${email}`)) as Record<string, string> | null;
      return {
        email,
        name: data?.name || "",
        image: data?.image || "",
        lastSignIn: data?.lastSignIn,
        lastSignOut: data?.lastSignOut,
        blocked: data?.blocked === "true",
      };
    })
  );

  return users.sort((a, b) => (b.lastSignIn || "").localeCompare(a.lastSignIn || ""));
}

export async function toggleBlockUser(email: string, blocked: boolean) {
  await redis.hset(`user:${email}`, { blocked: blocked ? "true" : "false" });
  revalidatePath("/admin");
}

export async function deleteUserAccount(email: string) {
  await redis.del(`user:${email}`);
  await redis.del(`activity:${email}`);
  await redis.srem("all_users", email);
  revalidatePath("/admin");
}

export async function getUserActivity(email: string): Promise<ActivityEntry[]> {
  const raw = (await redis.lrange(`activity:${email}`, 0, 49)) as string[];
  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? JSON.parse(r) : (r as any);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function getGlobalActivity(): Promise<ActivityEntry[]> {
  const raw = (await redis.lrange("activity_log", 0, 99)) as string[];
  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? JSON.parse(r) : (r as any);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}