import { auth } from "@/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
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
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};