import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getRedis } from "@/lib/redis";
import { isAdminEmail } from "@/lib/admin";

async function logActivity(email: string, type: "signin" | "signout") {
  const redis = getRedis();
  if (!redis) return;

  const at = new Date().toISOString();
  const entry = JSON.stringify({ type, email, at });

  try {
    await redis.lpush(`activity:${email}`, entry);
    await redis.ltrim(`activity:${email}`, 0, 199);

    await redis.lpush("activity_log", entry);
    await redis.ltrim("activity_log", 0, 999);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const redis = getRedis();
      if (!redis) return true;

      try {
        const record = (await redis.hgetall(`user:${user.email}`)) as Record<string, unknown> | null;
        if (record && record.blocked === "true") {
          return "/blocked";
        }
      } catch (err) {
        console.error("Failed to check block status:", err);
      }

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.email) return;
      const redis = getRedis();
      if (!redis) return;

      try {
        const [existing, siteSettings] = (await Promise.all([
          redis.hgetall(`user:${user.email}`),
          redis.hgetall("site_settings"),
        ])) as [Record<string, string> | null, Record<string, string> | null];

        const requireApproval = siteSettings?.requireApproval === "true";
        const alreadyApproved = existing?.approved === "true";
        const approved =
          isAdminEmail(user.email) || alreadyApproved || !requireApproval ? "true" : "false";

        await redis.hset(`user:${user.email}`, {
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          approved,
          lastSignIn: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        });
        await redis.hincrby(`user:${user.email}`, "signInCount", 1);
        await redis.sadd("all_users", user.email);
        await logActivity(user.email, "signin");
      } catch (err) {
        console.error("Failed to save user to Redis:", err);
      }
    },
    async signOut(message) {
      const email = (message as { token?: { email?: string } })?.token?.email;
      const redis = getRedis();
      if (!email || !redis) return;

      try {
        await redis.hset(`user:${email}`, {
          lastSignOut: new Date().toISOString(),
        });
        await logActivity(email, "signout");
      } catch (err) {
        console.error("Failed to log sign-out:", err);
      }
    },
  },
});
