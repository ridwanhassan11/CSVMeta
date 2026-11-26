import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: Request) {
  const session = await auth();
  const adminEmail = session?.user?.email?.toLowerCase().trim();
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { email, action } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, error: "Email missing" }, { status: 400 });
  }

  const blocked = action !== "unblock";
  await redis.hset(`user:${email}`, { blocked: blocked ? "true" : "false" });

  return NextResponse.json({ success: true });
}
