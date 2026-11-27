import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getRedis } from "@/lib/redis";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ success: false, error: "Redis is not configured" }, { status: 500 });
  }

  const { email, action } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, error: "Email missing" }, { status: 400 });
  }

  const blocked = action !== "unblock";
  await redis.hset(`user:${email}`, { blocked: blocked ? "true" : "false" });

  return NextResponse.json({ success: true });
}
