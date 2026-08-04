"use client";

export type Provider = "gemini" | "groq" | "mistral" | "openai" | "openrouter";

export type GeminiModel =
  | "gemini-3.1-pro"
  | "gemini-3.5-flash"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite";

export type MistralModel = "pixtral-large-latest" | "pixtral-12b-2409";

export type OpenAIModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4.1-mini";

export type Platform =
  | "general"
  | "adobe-stock"
  | "shutterstock"
  | "freepik"
  | "vecteezy"
  | "pond5";

export type Mode = "metadata" | "prompt";

export type GenerationSettings = {
  provider: Provider;
  geminiModel: GeminiModel;
  mistralModel: MistralModel;
  openaiModel: OpenAIModel;
  openrouterModel: string;
  mode: Mode;
  platform: Platform;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  parallel: boolean;
};

const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: "Google Gemini",
  groq: "Groq",
  mistral: "Mistral AI",
  openai: "OpenAI",
  openrouter: "OpenRouter",
};

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "general", label: "General" },
  { id: "adobe-stock", label: "Adobe Stock" },
  { id: "shutterstock", label: "Shutterstock" },
  { id: "freepik", label: "FreePik" },
  { id: "vecteezy", label: "Vecteezy" },
  { id: "pond5", label: "Pond5" },
];

function getCurrentModelLabel(settings: GenerationSettings): string {
  switch (settings.provider) {
    case "gemini":
      return settings.geminiModel;
    case "mistral":
      return settings.mistralModel;
    case "openai":
      return settings.openaiModel;
    case "openrouter":
      return settings.openrouterModel || "কোনো মডেল সেট করা নেই";
    case "groq":
      return "qwen/qwen3.6-27b";
    default:
      return "";
  }
}

export default function ControlsPanel({
  settings,
  onChange,
  onOpenKeys,
  disabled,
}: {
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  onOpenKeys: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full max-w-[340px] shrink-0 space-y-4">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
        <p className="font-semibold text-slate-900 dark:text-white">Controls</p>

        {/* 👇 এখানে ক্লিক করলে provider + model + API key ম্যানেজ করার পপআপ খুলবে */}
        <button
          onClick={onOpenKeys}
          disabled={disabled}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-left disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {PROVIDER_LABELS[settings.provider]}
            </p>
            <p className="truncate text-xs text-slate-400">{getCurrentModelLabel(settings)}</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-slate-400"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <div className="mt-4 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => onChange({ mode: "metadata" })}
            disabled={disabled}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              settings.mode === "metadata"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Metadata
          </button>
          <button
            onClick={() => onChange({ mode: "prompt" })}
            disabled={disabled}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              settings.mode === "prompt"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Prompt
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between transition-colors">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-sm">Batch Generation</p>
          <p className="text-xs text-slate-400 mt-0.5">Process multiple at once</p>
        </div>
        <button
          onClick={() => onChange({ parallel: !settings.parallel })}
          disabled={disabled}
          className={`h-6 w-11 rounded-full transition ${
            settings.parallel ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <div
            className={`h-5 w-5 rounded-full bg-white dark:bg-slate-900 transition-transform ${
              settings.parallel ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {settings.mode === "metadata" ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">EXPORT PLATFORM</p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChange({ platform: p.id })}
                  disabled={disabled}
                  className={`rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    settings.platform === p.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-semibold text-slate-400">TITLE LENGTH</p>
              <p className="font-semibold text-slate-900 dark:text-white">{settings.titleLength} chars</p>
            </div>
            <input
              type="range"
              min={40}
              max={200}
              value={settings.titleLength}
              onChange={(e) => onChange({ titleLength: Number(e.target.value) })}
              disabled={disabled}
              className="mt-2 w-full accent-slate-900 dark:accent-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-semibold text-slate-400">KEYWORDS COUNT</p>
              <p className="font-semibold text-slate-900 dark:text-white">{settings.keywordsCount} keywords</p>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              value={settings.keywordsCount}
              onChange={(e) => onChange({ keywordsCount: Number(e.target.value) })}
              disabled={disabled}
              className="mt-2 w-full accent-slate-900 dark:accent-white"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
          <p className="text-xs font-semibold text-slate-400 mb-2">PROMPT STYLE (optional)</p>
          <textarea
            value={settings.extraInstructions}
            onChange={(e) => onChange({ extraInstructions: e.target.value })}
            disabled={disabled}
            rows={6}
            placeholder="e.g. cinematic lighting, photorealistic, 8k, ultra detailed..."
            className="w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-200 resize-none outline-none"
          />
        </div>
      )}
    </div>
  );
}