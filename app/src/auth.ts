import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

async function logActivity(email: string, type: "signin" | "signout") {
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

      try {
        const record = await redis.hgetall(`user:${user.email}`);
        if (record && (record as any).blocked === "true") {
          return false;
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
      try {
        await redis.hset(`user:${user.email}`, {
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          lastSignIn: new Date().toISOString(),
        });
        await redis.sadd("all_users", user.email);
        await logActivity(user.email, "signin");
      } catch (err) {
        console.error("Failed to save user to Redis:", err);
      }
    },
    async signOut(message) {
      const email = (message as any)?.token?.email;
      if (!email) return;
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