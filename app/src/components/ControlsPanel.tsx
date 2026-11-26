"use client";

import {
  PLATFORMS,
  PROVIDER_LABELS,
  getCurrentModelLabel,
  type GenerationSettings,
  type Platform,
} from "@/lib/types";

export type {
  Provider,
  GeminiModel,
  GroqModel,
  MistralModel,
  OpenAIModel,
  Platform,
  Mode,
  GenerationSettings,
} from "@/lib/types";

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
  const activePlatform = PLATFORMS.find((p) => p.id === settings.platform) || PLATFORMS[0];

  function handlePlatformClick(id: Platform) {
    const spec = PLATFORMS.find((p) => p.id === id);
    if (!spec) {
      onChange({ platform: id });
      return;
    }
    onChange({
      platform: id,
      titleLength: Math.min(spec.defaultTitleLength, spec.maxTitleLength),
      keywordsCount: Math.min(spec.defaultKeywordsCount, spec.maxKeywordsCount),
    });
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenKeys}
            disabled={disabled}
            className="flex min-w-0 items-center gap-2 text-left hover:opacity-80 disabled:opacity-50"
          >
            <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-zinc-200">
              {PROVIDER_LABELS[settings.provider]}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenKeys}
            disabled={disabled}
            className="max-w-[155px] truncate rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300"
            title="Change AI Provider, Model or API Keys"
          >
            {getCurrentModelLabel(settings)}
          </button>
        </div>

        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Generation Mode
        </p>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/60 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => onChange({ mode: "metadata" })}
            disabled={disabled}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              settings.mode === "metadata"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Metadata
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "prompt" })}
            disabled={disabled}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              settings.mode === "prompt"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Image Prompt
          </button>
        </div>

        {settings.mode === "metadata" ? (
          <>
            <div className="mt-3.5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Export Platform
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePlatformClick(p.id)}
                    disabled={disabled}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                      settings.platform === p.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-2xs dark:border-indigo-500 dark:bg-indigo-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
                CSV: {activePlatform.csvHint}
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3">
              <label className="min-w-0">
                <span className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  <span>Title Length</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {settings.titleLength}
                  </span>
                </span>
                <input
                  type="range"
                  min={40}
                  max={activePlatform.maxTitleLength}
                  value={Math.min(settings.titleLength, activePlatform.maxTitleLength)}
                  onChange={(e) => onChange({ titleLength: Number(e.target.value) })}
                  disabled={disabled}
                  className="mt-2 w-full accent-indigo-600"
                />
              </label>

              <label className="min-w-0">
                <span className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  <span>Tags Count</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {settings.keywordsCount}
                  </span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={activePlatform.maxKeywordsCount}
                  value={Math.min(settings.keywordsCount, activePlatform.maxKeywordsCount)}
                  onChange={(e) => onChange({ keywordsCount: Number(e.target.value) })}
                  disabled={disabled}
                  className="mt-2 w-full accent-indigo-600"
                />
              </label>
            </div>

            <div className="mt-3.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Extra Instructions (Optional)
              </p>
              <textarea
                value={settings.extraInstructions}
                onChange={(e) => onChange({ extraInstructions: e.target.value })}
                disabled={disabled}
                rows={2}
                placeholder="e.g. minimal style, isolated on white..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
          </>
        ) : (
          <div className="mt-3.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Prompt Style (Optional)
            </p>
            <textarea
              value={settings.extraInstructions}
              onChange={(e) => onChange({ extraInstructions: e.target.value })}
              disabled={disabled}
              rows={3}
              placeholder="Describe the visual style..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
        )}

        <div className="mt-3.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Request Pace
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { ms: 800, label: "Fast (0.8s)" },
              { ms: 2000, label: "Safe (2s)" },
              { ms: 4000, label: "Free Tier (4s)" },
            ].map((opt) => (
              <button
                key={opt.ms}
                type="button"
                onClick={() => onChange({ delayMs: opt.ms })}
                disabled={disabled}
                className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold transition ${
                  (settings.delayMs ?? 2000) === opt.ms
                    ? "border-slate-900 bg-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="mt-2.5 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <span>Auto-fallback model &amp; rotate keys</span>
            <input
              type="checkbox"
              checked={settings.smartFallback ?? true}
              onChange={(e) => onChange({ smartFallback: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 accent-indigo-600"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
