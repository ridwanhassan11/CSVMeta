import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const PING_COOKIE = "cm_last_ping";
const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isAdminRoute) {
    const email = req.auth?.user?.email?.toLowerCase().trim();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
  }

  const response = NextResponse.next();

  // 👇 লোকেশন ও লাস্ট-অ্যাক্টিভ ট্র্যাক করা, কুকি দিয়ে থ্রটল করা (প্রতি ৫ মিনিটে একবার)
  if (isLoggedIn && req.auth?.user?.email) {
    const lastPing = req.cookies.get(PING_COOKIE)?.value;
    const now = Date.now();
    const shouldPing = !lastPing || now - Number(lastPing) > PING_INTERVAL_MS;

    if (shouldPing) {
      const email = req.auth.user.email;
      const country = req.headers.get("x-vercel-ip-country") || "";
      const cityRaw = req.headers.get("x-vercel-ip-city");
      const city = cityRaw ? decodeURIComponent(cityRaw) : "";
      const region = req.headers.get("x-vercel-ip-country-region") || "";

      try {
        await redis.hset(`user:${email}`, {
          lastActive: new Date(now).toISOString(),
          country,
          city,
          region,
        });
      } catch (err) {
        console.error("Failed to update last-active/location:", err);
      }

      response.cookies.set(PING_COOKIE, String(now), {
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};