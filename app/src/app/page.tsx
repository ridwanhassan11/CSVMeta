import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserAccessStatus } from "@/lib/userTracking";
import WorkspaceClient from "@/components/WorkspaceClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const access = await getUserAccessStatus(email);
  if (access.blocked) {
    redirect("/blocked");
  }
  if (access.pending) {
    redirect("/pending");
  }

  return <WorkspaceClient />;
}
