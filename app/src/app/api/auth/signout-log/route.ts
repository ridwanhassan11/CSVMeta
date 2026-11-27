import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordUserSignOut } from "@/lib/userTracking";

export async function POST() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await recordUserSignOut(email);
  return NextResponse.json({ ok: true });
}
