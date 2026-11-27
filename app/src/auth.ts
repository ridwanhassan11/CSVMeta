import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ensureLiveRedis } from "@/lib/redis";
import { normalizeEmail, recordUserSignIn, recordUserSignOut } from "@/lib/userTracking";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user?.email);
      if (!email) return false;

      const redis = await ensureLiveRedis();
      if (!redis) return true;

      try {
        const record = (await redis.hgetall(`user:${email}`)) as Record<string, unknown> | null;
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
      await recordUserSignIn({
        email: user?.email,
        name: user?.name,
        image: user?.image,
      });
    },
    async signOut(message) {
      const msg = message as {
        token?: { email?: string | null };
        session?: { user?: { email?: string | null } };
      };
      const email = msg?.token?.email || msg?.session?.user?.email;
      await recordUserSignOut(email);
    },
  },
});
