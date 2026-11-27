import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAllUsers } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!isAdminEmail(email)) {
    return NextResponse.json({ isAdmin: false });
  }

  try {
    const users = await getAllUsers();
    const onlineNow = users.filter((u) => u.online).length;
    return NextResponse.json({
      isAdmin: true,
      onlineNow,
      totalUsers: users.length,
    });
  } catch {
    return NextResponse.json({ isAdmin: true });
  }
}
