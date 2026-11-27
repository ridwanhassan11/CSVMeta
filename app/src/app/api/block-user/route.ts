import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
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
