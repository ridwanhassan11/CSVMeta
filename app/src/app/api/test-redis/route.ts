import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export async function GET() {
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
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Unknown error",
      urlExists: !!process.env.KV_REST_API_URL,
      tokenExists: !!process.env.KV_REST_API_TOKEN,
    });
  }
}