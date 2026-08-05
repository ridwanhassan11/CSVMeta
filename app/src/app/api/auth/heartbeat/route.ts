import { auth } from "@/auth";
import { updateHeartbeat } from "@/app/admin/actions";
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

  return NextResponse.json({ ok: true });
}