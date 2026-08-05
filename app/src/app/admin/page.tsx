import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllUsers, getGlobalActivity } from "./actions";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // middleware.ts ইতিমধ্যে নন-অ্যাডমিনদের এখানে ঢুকতে বাধা দিচ্ছে

  const [users, activity] = await Promise.all([getAllUsers(), getGlobalActivity()]);

  return <AdminDashboard initialUsers={users} initialActivity={activity} />;
}