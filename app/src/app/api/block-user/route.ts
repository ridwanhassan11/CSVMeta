import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: Request) {
  const { email, action } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, error: "Email missing" }, { status: 400 });
  }

  if (action === "unblock") {
    await redis.srem("blocked_users", email);
  } else {
    await redis.sadd("blocked_users", email);
  }

  return NextResponse.json({ success: true });
}