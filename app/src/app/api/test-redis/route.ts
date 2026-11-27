import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getRedis, getRedisConfigStatus } from "@/lib/redis";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const cfg = getRedisConfigStatus();
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json({
      success: false,
      error: "Redis URL or Token missing in environment variables",
      urlExists: cfg.hasUrl,
      tokenExists: cfg.hasToken,
    });
  }

  try {
    await redis.set("test_key", "hello_world");
    const value = await redis.get("test_key");

    return NextResponse.json({
      success: true,
      value,
      urlExists: cfg.hasUrl,
      tokenExists: cfg.hasToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      error: message,
      urlExists: cfg.hasUrl,
      tokenExists: cfg.hasToken,
    });
  }
}
