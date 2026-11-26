import { signIn } from "@/auth";

const STEPS = [
  {
    title: "Upload photos & vectors",
    desc: "Drag and drop unlimited JPG, PNG, WEBP, SVG, or EPS files in one batch — every aspect ratio preserved.",
  },
  {
    title: "AI analyzes every asset",
    desc: "Gemini, GPT-4o, Pixtral, Llama 4, or Qwen Vision reads your artwork and understands subject, style, and mood.",
  },
  {
    title: "Edit inline in one clean table",
    desc: "Refine titles, descriptions, and up to 50 ranked keywords with live character counts and 1-click copy.",
  },
  {
    title: "Export marketplace-ready CSV",
    desc: "Download formatted CSVs built specifically for Adobe Stock, Shutterstock, Freepik, Vecteezy, or Pond5.",
  },
];

const PLATFORMS = [
  { name: "Adobe Stock", format: "Filename, Title, Keywords, Category, Releases" },
  { name: "Shutterstock", format: "Auto Illustration Flag + Description" },
  { name: "Freepik", format: "Semicolon (;) UTF-8 CSV" },
  { name: "Vecteezy", format: "Title, Description & Keywords" },
  { name: "Pond5", format: "OriginalFilename & Clip Metadata" },
];

const AI_PROVIDERS = [
  {
    name: "Google Gemini",
    tag: "Free & Paid",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </svg>
    ),
  },
  {
    name: "Groq",
    tag: "Ultra Fast",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: "Mistral AI",
    tag: "Pixtral Vision",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    name: "OpenAI",
    tag: "GPT-4o / 4.1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    name: "OpenRouter",
    tag: "Multi-Model",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
    title: "Unlimited batch + 3x Quota Saver",
    desc: "Upload hundreds of files at once and bundle up to 3 images per API call with automatic key rotation.",
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
    title: "Native SVG & EPS vector support",
    desc: "Extracts EPS previews, PostScript paths, and SVG artwork automatically for accurate commercial tagging.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Platform-exact CSV schemas",
    desc: "Automatic headers, delimiters, character limits, and illustration flags tailored to each marketplace.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Bring your own API keys",
    desc: "Keys stay 100% local in your browser with instant connection testing and smart model fallback.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="m21 2-9.6 9.6" />
        <path d="m15.5 7.5 3 3L22 7l-3-3" />
      </svg>
    ),
  },
];

function GoogleIcon() {
  return (
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
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-indigo-500/30">
      {/* ===== TOP NAVIGATION ===== */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#09090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-black text-white shadow-lg shadow-indigo-500/25">
              ◈
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">CSVMeta</span>
              <span className="ml-2 hidden rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 sm:inline-block">
                AI Studio
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-xs font-medium text-zinc-400 md:flex">
            <a href="#workflow" className="transition hover:text-white">
              How it works
            </a>
            <a href="#platforms" className="transition hover:text-white">
              Platforms
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
          </nav>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12]"
            >
              Sign in →
            </button>
          </form>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden px-6 pb-20 pt-14 lg:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="absolute -top-32 left-1/4 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-[130px]" />
          <div className="absolute right-1/6 top-24 h-[22rem] w-[22rem] rounded-full bg-blue-500/15 blur-[130px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: Headline + Auth Box */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Built for Adobe Stock, Shutterstock, Freepik &amp; Vecteezy
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:leading-[1.1]">
              Turn Images, SVGs &amp; EPS into{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Store-Ready CSVs
              </span>{" "}
              in Seconds.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              Generate commercial titles, factual descriptions, and ranked keywords across unlimited batches — with smart key rotation, 3x quota saving, and exact marketplace CSV exports.
            </p>

            {/* Sign in card */}
            <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Start generating for free</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Sign in with your Google account to open your workspace.
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  BYOK
                </span>
              </div>

              <form
                className="mt-5"
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-zinc-100"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span>✓ Encrypted OAuth</span>
                <span>✓ Keys stay in browser</span>
                <span>✓ Unlimited files</span>
              </div>
            </div>
          </div>

          {/* Right: Live Product Preview Card */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-medium text-zinc-400">
                    metadata-workspace.csv
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  ✓ 100% Ready
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-3.5">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30">
                    <span className="text-xs font-bold text-indigo-300">SVG</span>
                    <span className="text-[10px] text-zinc-400">1672×1672</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-400">
                      cozy-autumn-coffee-character.svg
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Cute Ghost Reading Book with Pumpkin Coffee Vector Illustration
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-3.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Generated Tags</span>
                    <span className="text-indigo-400 font-semibold">45 keywords</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      "vector illustration",
                      "autumn",
                      "cozy",
                      "coffee cup",
                      "book lover",
                      "isolated",
                      "sticker",
                      "cute character",
                      "seasonal",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-zinc-950/70 px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {["Adobe Stock", "Shutterstock", "Freepik"].map((p, idx) => (
                      <span
                        key={p}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          idx === 0
                            ? "bg-indigo-600 text-white"
                            : "bg-white/[0.05] text-zinc-400"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                    ↓ Export CSV
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORMS ===== */}
      <section id="platforms" className="border-t border-white/[0.08] bg-zinc-950/60 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Marketplace Schemas
          </p>
          <h2 className="mt-2.5 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Exact CSV columns for every stock platform
          </h2>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 transition hover:border-indigo-500/40"
              >
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{p.format}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="workflow" className="border-t border-white/[0.08] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Workflow
          </p>
          <h2 className="mt-2.5 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            From raw assets to upload-ready CSV in 4 steps
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-sm font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI PROVIDERS ===== */}
      <section className="border-t border-white/[0.08] bg-zinc-950/60 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            AI Engines
          </p>
          <h2 className="mt-2.5 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Connect any leading vision model
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {AI_PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 text-center transition hover:border-indigo-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                  {p.icon}
                </div>
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <span className="text-[11px] text-zinc-400">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="border-t border-white/[0.08] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Built for Contributors
          </p>
          <h2 className="mt-2.5 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything you need to scale submissions
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <footer className="border-t border-white/[0.08] bg-zinc-950 px-6 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to automate your stock metadata?
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Sign in with Google and export your first CSV in minutes.
          </p>

          <form
            className="mt-7 flex justify-center"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-zinc-100"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <p className="mt-10 text-xs text-zinc-500">
            © {new Date().getFullYear()} CSVMeta — AI Metadata Studio
          </p>
        </div>
      </footer>
    </main>
  );
}
