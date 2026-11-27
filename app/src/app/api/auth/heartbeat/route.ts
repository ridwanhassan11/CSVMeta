import { auth } from "@/auth";
import { updateHeartbeat } from "@/app/admin/actions";
import { isAdminEmail } from "@/lib/admin";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const country = req.headers.get("x-vercel-ip-country") || "";
  const cityRaw = req.headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : "";
  const location = [city, country].filter(Boolean).join(", ");

  await updateHeartbeat(email, location || undefined);

  if (isAdminEmail(email)) {
    return NextResponse.json({ ok: true, blocked: false, pending: false });
  }

  try {
    const [userRecord, siteSettings] = (await redis
      .pipeline()
      .hgetall(`user:${email}`)
      .hgetall("site_settings")
      .exec()) as [Record<string, string> | null, Record<string, string> | null];

    const blocked = userRecord?.blocked === "true";
    const requireApproval = siteSettings?.requireApproval === "true";
    const pending = !blocked && requireApproval && userRecord?.approved !== "true";

    return NextResponse.json({ ok: true, blocked, pending });
  } catch {
    return NextResponse.json({ ok: true, blocked: false, pending: false });
  }
}
