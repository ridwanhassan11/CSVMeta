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

const STEPS = [
  {
    title: "Upload your images",
    desc: "Drag and drop up to 100 images at once — JPG, PNG, or WEBP.",
  },
  {
    title: "AI analyzes each photo",
    desc: "Gemini, GPT-4o, Pixtral, or Llama reads the image and understands what's in it.",
  },
  {
    title: "Get ready-to-use metadata",
    desc: "Title, description, and keywords generated instantly — edit anything before export.",
  },
  {
    title: "Export as CSV",
    desc: "Download a platform-ready CSV file and upload it straight to your stock account.",
  },
];

const PLATFORMS = ["Adobe Stock", "Shutterstock", "Freepik", "Vecteezy", "Pond5"];

const AI_PROVIDERS = [
  {
    name: "Google Gemini",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </svg>
    ),
  },
  {
    name: "Groq",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: "Mistral AI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    name: "OpenAI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    ),
  },
  {
    name: "OpenRouter",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="M6 8.2V12a2 2 0 0 0 2 2h1.5M18 8.2V12a2 2 0 0 1-2 2h-1.5" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: "Batch generation",
    desc: "Process dozens of images in one run, sequentially or in parallel.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Editable results",
    desc: "Every title, description, and keyword list is editable before you export.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    title: "Platform-aware rules",
    desc: "Title length and keyword count automatically match each platform's requirements.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Bring your own key",
    desc: "Use your own API key with any provider — your key stays in your browser only.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="m21 2-9.6 9.6" />
        <path d="m15.5 7.5 3 3L22 7l-3-3" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  return (
    <main className="bg-[#0B0A14]">
      {/* ===== HERO — original single-panel design, unchanged ===== */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B0A14] px-4">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#7C5CFC]/25 blur-[120px]" />
          <div className="absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[#F0A93E]/15 blur-[110px]" />

          {SAMPLE_TAGS.map((tag, i) => (
            <span
              key={tag}
              className="tag-chip absolute rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/70 backdrop-blur-md whitespace-nowrap"
              style={{
                left: `${(i * 19 + 5) % 92}%`,
                top: `${(i * 31 + 3) % 90}%`,
                animationDelay: `${i * 0.9}s`,
                animationDuration: `${7 + (i % 4)}s`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide text-white/90">CSVMeta</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-10 text-center shadow-2xl">
            <p className="text-3xl font-bold tracking-tight text-white">Welcome back to CSVMeta</p>
            <p className="mt-3 text-sm text-white/60">Sign in to your account</p>
            <p className="mt-1 text-sm text-white/60">Use your Google account to continue.</p>

            <form
              className="mt-8"
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:shadow-md transition"
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
                Sign in with Google
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4 text-[11px] text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              <span>Secure & encrypted</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-white/40">
              By signing in, you agree to CSVMeta&apos;s Terms and Privacy Policy.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} CSVMeta Powered by AI
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 animate-bounce">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            Scroll down to learn more about CSVMeta
          </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t border-white/10 bg-[#0E0D1A] px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A7FF]">
            How it works
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Image in, ready-to-upload metadata out
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORMS ===== */}
      <section className="border-t border-white/10 bg-[#0B0A14] px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A7FF]">
            Works with your platform
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Export CSVs built for every marketplace
          </h2>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI PROVIDERS ===== */}
      <section className="border-t border-white/10 bg-[#0E0D1A] px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A7FF]">
            Powered by leading AI
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Choose the model that fits your workflow
          </h2>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {AI_PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#B9A7FF]">
                  {p.icon}
                </div>
                <p className="text-xs font-medium text-slate-300">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="border-t border-white/10 bg-[#0B0A14] px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A7FF]">
            Built for volume
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything you need to move fast
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0A93E]/15 text-[#F0A93E]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="border-t border-white/10 bg-[#12111F] px-6 py-20 text-center lg:px-16">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to speed up your metadata workflow?
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Sign in with Google and generate your first batch in minutes.
          </p>

          <form
            className="mt-8 flex justify-center"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:shadow-md transition"
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
              Sign in with Google
            </button>
          </form>

          <p className="mt-10 text-xs text-white/30">© {new Date().getFullYear()} CSVMeta — Powered by AI</p>
        </div>
      </section>

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