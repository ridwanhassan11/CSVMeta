import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllUsers, getGlobalActivity } from "./actions";
import AdminDashboard from "./AdminDashboard";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // 👇 ADMIN_EMAILS সেট করা না থাকলে বা মিলে না গেলে কাউকে অ্যাক্সেস দেওয়া হবে না
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    redirect("/");
  }

  const [users, activity] = await Promise.all([getAllUsers(), getGlobalActivity()]);

  return <AdminDashboard initialUsers={users} initialActivity={activity} />;
}