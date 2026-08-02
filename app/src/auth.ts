import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      try {
        if (user?.email) {
          await redis.hset(`user:${user.email}`, {
            email: user.email,
            name: user.name || "",
            image: user.image || "",
            lastSignIn: new Date().toISOString(),
          });
          await redis.sadd("all_users", user.email);
        }
      } catch (err) {
        console.error("Failed to save user to Redis:", err);
      }
      return true;
    },
  },
});