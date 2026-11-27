import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getAdminSnapshot } from "./actions";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const snapshot = await getAdminSnapshot();

  return (
    <AdminDashboard
      initialUsers={snapshot.users}
      initialActivity={snapshot.activity}
      initialRequireApproval={snapshot.requireApproval}
      redisStatus={snapshot.redisStatus}
    />
  );
}
