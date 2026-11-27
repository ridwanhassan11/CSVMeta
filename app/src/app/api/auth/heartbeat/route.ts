import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { recordUserHeartbeat } from "@/lib/userTracking";
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

  const status = await recordUserHeartbeat({
    email,
    name: session.user?.name,
    image: session.user?.image,
    location: location || undefined,
  });

  if (isAdminEmail(email)) {
    return NextResponse.json({ ok: true, blocked: false, pending: false });
  }

  return NextResponse.json({
    ok: true,
    blocked: status.blocked,
    pending: status.pending,
  });
}
