import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getAllUsers, getApprovalMode, getGlobalActivity } from "./actions";
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

  const [users, activity, requireApproval] = await Promise.all([
    getAllUsers(),
    getGlobalActivity(),
    getApprovalMode(),
  ]);

  return (
    <AdminDashboard
      initialUsers={users}
      initialActivity={activity}
      initialRequireApproval={requireApproval}
    />
  );
}
