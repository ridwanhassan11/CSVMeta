import { signIn } from "@/auth";

const SAMPLE_TAGS = [
  "golden hour",
  "aerial view",
  "4K",
  "copy space",
  "minimalist",
  "high resolution",
  "vibrant colors",
  "outdoors",
  "professional",
  "close-up",
];

export default function LoginPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-[#FAF9F6] dark:bg-[#0B0A14]">
      {/* LEFT — brand showcase */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#12111F] px-14 py-12">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#7C5CFC]/30 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[#F0A93E]/20 blur-[100px]" />

        {/* grain / grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* logo row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <img src="/logo-icon.png" alt="" className="h-5 w-5 object-contain" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white/90">CSVMeta</span>
        </div>

        {/* signature visual: photo silhouette with tags rising off it */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative h-64 w-64">
            {/* frame representing an uploaded photo */}
            <div className="absolute inset-0 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-[#7C5CFC]/40 via-[#3E3B6B]/40 to-[#F0A93E]/30" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.4"
                className="absolute inset-0 m-auto h-10 w-10 opacity-70"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5.5-5.5L9 17" />
              </svg>
            </div>

            {/* floating keyword chips */}
            {SAMPLE_TAGS.map((tag, i) => (
              <span
                key={tag}
                className="tag-chip absolute rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/70 backdrop-blur-md whitespace-nowrap"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  animationDelay: `${i * 0.9}s`,
                  animationDuration: `${7 + (i % 4)}s`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* headline + copy */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-[1.75rem] font-semibold leading-snug tracking-tight text-white">
            প্রতিটা ছবি থেকে,
            <br />
            <span className="bg-gradient-to-r from-[#B9A7FF] to-[#F0A93E] bg-clip-text text-transparent">
              নিখুঁত মেটাডেটা।
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Adobe Stock, Shutterstock, Freepik — যেকোনো প্ল্যাটফর্মের জন্য টাইটেল, ডেসক্রিপশন ও কীওয়ার্ড
            সেকেন্ডেই তৈরি করুন AI দিয়ে।
          </p>
        </div>
      </div>

      {/* RIGHT — sign-in */}
      <div className="relative flex items-center justify-center px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative w-full max-w-sm">
          {/* mobile-only compact brand row */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12111F]/5 dark:bg-white/10 ring-1 ring-[#12111F]/10 dark:ring-white/15">
              <img src="/logo-icon.png" alt="" className="h-5 w-5 object-contain" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-slate-800 dark:text-white/90">
              CSVMeta
            </span>
          </div>

          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </p>
          <h1 className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            আপনার অ্যাকাউন্টে সাইন ইন করুন
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            চালিয়ে যেতে আপনার Google অ্যাকাউন্ট ব্যবহার করুন।
          </p>

          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-white shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:bg-white/[0.07] transition"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span>নিরাপদ ও এনক্রিপ্টেড</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            সাইন ইন করার মাধ্যমে আপনি CSVMeta-এর শর্তাবলী ও গোপনীয়তা নীতি মেনে নিচ্ছেন।
          </p>

          <p className="mt-10 text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} CSVMeta — Powered by AI
          </p>
        </div>
      </div>

      <style>{`
        @keyframes tagFloat {
          0% { transform: translateY(12px); opacity: 0; }
          12% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-140px); opacity: 0; }
        }
        .tag-chip {
          animation-name: tagFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tag-chip { animation: none; opacity: 0.6; }
        }
      `}</style>
    </main>
  );
}