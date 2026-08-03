"use client";

export type Provider = "gemini" | "groq";

export type GeminiModel =
  | "gemini-3.1-pro"
  | "gemini-3.5-flash"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite";

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
  mode: Mode;
  platform: Platform;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  parallel: boolean;
};

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "general", label: "General" },
  { id: "adobe-stock", label: "Adobe Stock" },
  { id: "shutterstock", label: "Shutterstock" },
  { id: "freepik", label: "FreePik" },
  { id: "vecteezy", label: "Vecteezy" },
  { id: "pond5", label: "Pond5" },
];

const GEMINI_MODELS: { id: GeminiModel; label: string }[] = [
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro, best reasoning" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash, fast, default" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite, cheapest" },
];

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
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Controls</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings.provider === "gemini" ? "Google Gemini" : "Groq"}
            </p>
          </div>
          <button
            onClick={onOpenKeys}
            className="flex items-center gap-1.5 rounded-xl border border-slate-900 dark:border-white bg-slate-900 dark:bg-white px-3 py-2 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </svg>
            API Keys
          </button>
        </div>

        <select
          value={settings.provider}
          onChange={(e) => onChange({ provider: e.target.value as Provider })}
          disabled={disabled}
          className="mt-3 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 outline-none appearance-none"
        >
          <option value="gemini">Google Gemini</option>
          <option value="groq">Groq, llama-4-maverick</option>
        </select>

        {settings.provider === "gemini" && (
          <select
            value={settings.geminiModel}
            onChange={(e) => onChange({ geminiModel: e.target.value as GeminiModel })}
            disabled={disabled}
            className="mt-2 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 outline-none appearance-none"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}

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
