import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  const session = await auth();
  const adminEmail = session?.user?.email?.toLowerCase().trim();
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });

    await redis.set("test_key", "hello_world");
    const value = await redis.get("test_key");

    return NextResponse.json({
      success: true,
      value,
      urlExists: !!process.env.KV_REST_API_URL,
      tokenExists: !!process.env.KV_REST_API_TOKEN,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      error: message,
      urlExists: !!process.env.KV_REST_API_URL,
      tokenExists: !!process.env.KV_REST_API_TOKEN,
    });
  }
}
