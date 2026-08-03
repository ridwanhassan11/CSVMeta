import { signIn } from "@/auth";

const SAMPLE_TAGS = [
  { text: "golden hour", left: "6%", top: "10%" },
  { text: "aerial view", left: "82%", top: "8%" },
  { text: "4K", left: "22%", top: "6%" },
  { text: "professional", left: "88%", top: "22%" },
  { text: "copy space", left: "3%", top: "34%" },
  { text: "minimalist", left: "12%", top: "68%" },
  { text: "high resolution", left: "80%", top: "40%" },
  { text: "vibrant colors", left: "6%", top: "50%" },
  { text: "outdoors", left: "85%", top: "60%" },
  { text: "close-up", left: "90%", top: "80%" },
  { text: "studio light", left: "15%", top: "84%" },
  { text: "wide angle", left: "45%", top: "90%" },
  { text: "candid", left: "40%", top: "4%" },
  { text: "portrait", left: "60%", top: "88%" },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#12111F] flex items-center justify-center px-6 py-16">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#7C5CFC]/30 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[#F0A93E]/20 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-[20rem] w-[20rem] rounded-full bg-[#3E3B6B]/25 blur-[100px]" />

      {/* grain / grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* FLOATING TAGS — across the entire screen, at every breakpoint */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {SAMPLE_TAGS.map((tag, i) => (
          <span
            key={tag.text}
            className="tag-chip absolute rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 font-mono text-[11px] text-white/75 backdrop-blur-lg shadow-[0_4px_14px_rgba(0,0,0,0.2)] whitespace-nowrap"
            style={{
              left: tag.left,
              top: tag.top,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${7 + (i % 4)}s`,
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>

      {/* logo — top left, fixed above tag layer */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <img src="/logo-icon.png" alt="" className="h-5 w-5 object-contain" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-white/90">CSVMeta</span>
      </div>

      {/* CENTER — sign-in card, fixed above tag layer */}
      <div className="relative z-20 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]">
        <p className="text-3xl font-bold tracking-tight text-white">Welcome back</p>
        <h1 className="mt-2 text-sm font-medium text-white/60">Sign in to your account</h1>
        <p className="mt-2 text-sm text-white/60">Use your Google account to continue.</p>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 shrink-0">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" />
          </svg>
          <span className="shrink-0 px-1">Secure &amp; encrypted</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-white/40">
          By signing in, you agree to CSVMeta&apos;s Terms and Privacy Policy.
        </p>
      </div>

      {/* footer */}
      <p className="absolute bottom-6 z-20 text-xs text-white/30">
        © {new Date().getFullYear()} CSVMeta Powered by AI
      </p>

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