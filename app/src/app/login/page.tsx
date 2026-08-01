import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">CSVMeta</h1>
        <p className="text-sm text-slate-400 mb-8">চালিয়ে যেতে আপনার Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-200"
          >
            🔑 Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}