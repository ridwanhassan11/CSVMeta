import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { kv } from "@vercel/kv";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        // প্রতিটা ব্যবহারকারীর তথ্য একটা Redis "set"-এ ইমেইল দিয়ে key করে সেভ হচ্ছে
        await kv.hset(`user:${user.email}`, {
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          lastSignIn: new Date().toISOString(),
        });
        // সব ইমেইলের একটা তালিকা রাখার জন্য একটা set-এ যোগ করা
        await kv.sadd("all_users", user.email);
      }
      return true;
    },
  },
});