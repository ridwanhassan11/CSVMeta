import Image from "next/image";
import { signIn } from "@/auth";

const CAPABILITIES = [
  {
    title: "Analyze photos, illustrations, SVG & EPS vectors",
    desc: "Upload JPG, PNG, WEBP, SVG, or EPS files in any aspect ratio. For EPS and SVG artwork, embedded previews and vector text paths are extracted automatically so titles reflect your actual design.",
  },
  {
    title: "Marketplace-ready CSV formatting built in",
    desc: "Switch directly between Adobe Stock, Shutterstock, Freepik, Vecteezy, Pond5, and General CSV. Required column headers, character limits, semicolon delimiters for Freepik, and Illustration flags are handled for you.",
  },
  {
    title: "Live editing, keyword refinement & 1-click copy",
    desc: "Watch each asset populate in real time as it finishes generating. Edit titles, descriptions, or individual keyword tags inline inside the table, track live character counts, and copy any field instantly.",
  },
  {
    title: "Use your own API keys with built-in quota protection",
    desc: "Connect Google Gemini, Groq, Mistral, OpenAI, or OpenRouter keys stored privately in your browser. Process up to 3 images per API call, pace requests safely for free tiers, and rotate keys or models automatically.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload your batch",
    desc: "Drop photos or vector files in bulk. Every image is prepared cleanly on your device while preserving portrait, square, and landscape previews.",
  },
  {
    step: "02",
    title: "Pick target platform",
    desc: "Select Adobe Stock, Shutterstock, Freepik, Vecteezy, or Pond5, then set your preferred title length, keyword count (up to 50), and pace.",
  },
  {
    step: "03",
    title: "Generate & review inline",
    desc: "Start batch generation and see each completed image move to the top with its generated title, description, and ranked commercial keywords.",
  },
  {
    step: "04",
    title: "Download CSV & submit",
    desc: "Export a clean, properly formatted CSV spreadsheet and upload it directly alongside your files on stock contributor portals.",
  },
];

const SUPPORTED_PLATFORMS = [
  {
    name: "Adobe Stock",
    details: "Filename, Title, Keywords, Category, Releases",
  },
  {
    name: "Shutterstock",
    details: "Filename, Description, Keywords, Categories, Illustration (yes/no)",
  },
  {
    name: "Freepik",
    details: "Semicolon (;) delimited UTF-8 CSV with File name, Title, Keywords, Model",
  },
  {
    name: "Vecteezy",
    details: "Filename, Title, Description, Keywords (10–50 tags)",
  },
  {
    name: "Pond5",
    details: "OriginalFilename, Title, Description, Keywords",
  },
];

const AI_ENGINES = [
  { name: "Google Gemini", note: "Free & paid tiers with 3x batch mode and auto model fallback" },
  { name: "Groq", note: "High-speed Llama 4 Scout & Maverick vision processing" },
  { name: "Mistral AI", note: "Free & paid Mistral Small / Pixtral vision models for structured tagging" },
  { name: "OpenAI", note: "GPT-4o Mini & GPT-4.1 vision support" },
  { name: "OpenRouter", note: "Flexible access to Qwen, Gemini, and Llama vision models" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
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
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/easymeta-logo.png"
              alt="EasyMeta"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm shadow-indigo-600/20"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold tracking-tight text-slate-900">
                EasyMeta
              </span>
              <span className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 sm:inline-block">
                Stock Metadata Studio
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#capabilities" className="transition hover:text-slate-900">
              What it does
            </a>
            <a href="#workflow" className="transition hover:text-slate-900">
              How it works
            </a>
            <a href="#platforms" className="transition hover:text-slate-900">
              Export formats
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign in
            </button>
          </form>
        </div>
      </header>

      {/* ===== HERO & SIGN-IN ===== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-slate-50 px-6 py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-indigo-100/70 blur-[110px]" />
          <div className="absolute right-1/4 top-16 h-72 w-72 rounded-full bg-blue-100/60 blur-[110px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Built for stock photographers, illustrators &amp; vector contributors
            </p>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.14]">
              Generate clean titles, keywords, and marketplace CSVs from your files.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-[17px]">
              Instead of spending hours writing stock metadata manually, upload your JPG, PNG, WEBP, SVG, or EPS files in bulk. EasyMeta inspects every file with AI, writes accurate commercial metadata, lets you edit results inline, and exports ready-to-upload CSV spreadsheets.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xs">
                <p className="text-sm font-medium text-slate-900">5 File Formats</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  PNG, JPG, WEBP, SVG &amp; EPS vectors
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xs">
                <p className="text-sm font-medium text-slate-900">5 Stock Platforms</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Adobe Stock, Shutterstock, Freepik, Vecteezy &amp; Pond5
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xs">
                <p className="text-sm font-medium text-slate-900">Private API Keys</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Keys remain stored locally inside your browser
                </p>
              </div>
            </div>
          </div>

          {/* Sign-in Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/60 sm:p-8">
            <div className="flex items-center gap-3">
              <Image
                src="/easymeta-logo.png"
                alt="EasyMeta"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm shadow-indigo-600/20"
              />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Open EasyMeta Workspace
                </h2>
                <p className="text-sm text-slate-500">
                  Sign in with Google to save your workspace settings and history.
                </p>
              </div>
            </div>

            <form
              className="mt-6"
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
              <p className="flex items-center gap-2.5">
                <span className="text-emerald-600">✓</span>
                Upload single files or hundreds of images at once
              </p>
              <p className="flex items-center gap-2.5">
                <span className="text-emerald-600">✓</span>
                Generate either stock metadata or detailed image prompts
              </p>
              <p className="flex items-center gap-2.5">
                <span className="text-emerald-600">✓</span>
                Automatic key rotation and quota-saving batch mode
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT IT DOES ===== */}
      <section id="capabilities" className="px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              What you can do
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Designed for real stock contributor workflows
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Every control inside EasyMeta focuses on saving preparation time and preventing CSV upload rejections on microstock sites.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs"
              >
                <h3 className="text-base font-medium text-slate-900">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WORKFLOW ===== */}
      <section id="workflow" className="border-t border-slate-200/80 bg-white px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              Step by step
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              From raw assets to upload-ready CSV in four steps
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-medium text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EXPORT FORMATS & AI PROVIDERS ===== */}
      <section id="platforms" className="border-t border-slate-200/80 px-6 py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              CSV Export Formats
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Columns formatted for each stock marketplace
            </h2>
            <div className="mt-6 divide-y divide-slate-100">
              {SUPPORTED_PLATFORMS.map((p) => (
                <div key={p.name} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{p.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              Supported AI Providers
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Choose the vision model and pace that fits your quota
            </h2>
            <div className="mt-6 divide-y divide-slate-100">
              {AI_ENGINES.map((engine) => (
                <div key={engine.name} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-900">{engine.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{engine.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200/80 bg-white px-6 py-14 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Ready to prepare your next batch?
          </h2>
          <p className="mt-2.5 text-base text-slate-600">
            Sign in with Google to start generating metadata and exporting marketplace CSVs.
          </p>

          <form
            className="mt-6 flex justify-center"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            © {new Date().getFullYear()} EasyMeta — Stock Metadata Studio
          </p>
        </div>
      </footer>
    </main>
  );
}
