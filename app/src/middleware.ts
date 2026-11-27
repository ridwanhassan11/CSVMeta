import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isAdminEmail } from "@/lib/admin";

const PING_COOKIE = "cm_last_ping";
const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isStatusPage = path === "/blocked" || path === "/pending";
  const isAdminRoute = path.startsWith("/admin");

  if (!isLoggedIn && !isLoginPage && !isStatusPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  const email = req.auth?.user?.email?.trim();
  const isAdmin = isAdminEmail(email);

  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }

  if (isLoggedIn && email && !isAdmin) {
    try {
      const [userRecord, siteSettings] = (await redis
        .pipeline()
        .hgetall(`user:${email}`)
        .hgetall("site_settings")
        .exec()) as [Record<string, string> | null, Record<string, string> | null];

      const isBlocked = userRecord?.blocked === "true";
      const requireApproval = siteSettings?.requireApproval === "true";
      const isApproved = userRecord?.approved === "true";

      if (isBlocked) {
        if (path !== "/blocked") {
          return Response.redirect(new URL("/blocked", req.nextUrl));
        }
      } else if (requireApproval && !isApproved) {
        if (path !== "/pending") {
          return Response.redirect(new URL("/pending", req.nextUrl));
        }
      } else if (isStatusPage) {
        return Response.redirect(new URL("/", req.nextUrl));
      }
    } catch (err) {
      console.error("Failed to check user access status:", err);
    }
  }

  const response = NextResponse.next();

  // লোকেশন ও লাস্ট-অ্যাক্টিভ ট্র্যাক করা, কুকি দিয়ে থ্রটল করা (প্রতি ৫ মিনিটে একবার)
  if (isLoggedIn && email) {
    const lastPing = req.cookies.get(PING_COOKIE)?.value;
    const now = Date.now();
    const shouldPing = !lastPing || now - Number(lastPing) > PING_INTERVAL_MS;

    if (shouldPing) {
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
