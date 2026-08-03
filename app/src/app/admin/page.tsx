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

  const userEmail = session.user.email.toLowerCase().trim();

  // 👇 সাময়িক ডিবাগ — আপনার ইমেইল আর ADMIN_EMAILS ঠিকভাবে মিলছে কিনা দেখার জন্য
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", color: "#fff", background: "#111", minHeight: "100vh" }}>
        <h2>Debug Info (temporary)</h2>
        <p>আপনার সেশনের ইমেইল: <strong>{JSON.stringify(userEmail)}</strong></p>
        <p>ADMIN_EMAILS লিস্ট (পার্স হওয়ার পর): <strong>{JSON.stringify(ADMIN_EMAILS)}</strong></p>
        <p>মিলছে কিনা: <strong>{String(ADMIN_EMAILS.includes(userEmail))}</strong></p>
      </div>
    );
  }

  const [users, activity] = await Promise.all([getAllUsers(), getGlobalActivity()]);

  return <AdminDashboard initialUsers={users} initialActivity={activity} />;
}
