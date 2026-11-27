import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { recordUserSignOut } from "@/lib/userTracking";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
          ⏳
        </div>
        <h1 className="mt-4 text-xl font-semibold">অ্যাক্সেসের অনুমতির অপেক্ষায়</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          আপনার অ্যাকাউন্ট (<span className="font-medium text-indigo-600 dark:text-indigo-400">{userEmail}</span>) লগইন হয়েছে, তবে এই সাইটটি ব্যবহার করতে হোস্ট/অ্যাডমিনের অনুমতি প্রয়োজন। অনুমতি পাওয়ার পর নিচের বাটনে ক্লিক করুন।
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/"
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            অনুমতি পেলে ঢুকুন (Refresh)
          </Link>
          <form
            action={async () => {
              "use server";
              await recordUserSignOut(userEmail);
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              অন্য অ্যাকাউন্ট দিয়ে লগইন করুন
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
