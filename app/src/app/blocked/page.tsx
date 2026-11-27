import { auth, signOut } from "@/auth";
import Link from "next/link";
import { recordUserSignOut } from "@/lib/userTracking";

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-rose-200/80 bg-white p-8 text-center shadow-lg dark:border-rose-900/50 dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
          ⛔
        </div>
        <h1 className="mt-4 text-xl font-semibold">অ্যাক্সেস সীমাবদ্ধ করা হয়েছে</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          {userEmail ? (
            <>
              আপনার অ্যাকাউন্ট (<span className="font-medium text-slate-900 dark:text-white">{userEmail}</span>) হোস্ট/অ্যাডমিন দ্বারা ব্লক করা হয়েছে।
            </>
          ) : (
            "এই অ্যাকাউন্টটি বর্তমানে সাইটের অ্যাডমিন দ্বারা ব্লক করা আছে।"
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {userEmail ? (
            <form
              action={async () => {
                "use server";
                await recordUserSignOut(userEmail);
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                সাইন আউট করুন
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              লগইন পেজে ফিরে যান
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
