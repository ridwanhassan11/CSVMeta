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
      <div className="rounded-xl border border-violet-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenKeys}
            disabled={disabled}
            className="flex min-w-0 items-center gap-2 text-left hover:opacity-85 disabled:opacity-50"
          >
            <span className="text-lg">⚙</span>
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {PROVIDER_LABELS[settings.provider]}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenKeys}
            disabled={disabled}
            className="max-w-[140px] truncate rounded-md bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300"
            title="Change AI Provider, Model or API Keys"
          >
            {getCurrentModelLabel(settings)}
          </button>
        </div>

        <p className="mb-1.5 text-[11px] font-bold text-slate-500">GENERATION MODE</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ mode: "metadata" })}
            disabled={disabled}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
              settings.mode === "metadata"
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            ▧ Metadata
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "prompt" })}
            disabled={disabled}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
              settings.mode === "prompt"
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            ✧ Image Prompt
          </button>
        </div>

        {settings.mode === "metadata" ? (
          <>
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-bold text-slate-500">EXPORT PLATFORM</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePlatformClick(p.id)}
                    disabled={disabled}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${
                      settings.platform === p.id
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                CSV Format: {activePlatform.csvHint}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="min-w-0">
                <span className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Title Length</span>
                  <span className="text-violet-600">{settings.titleLength}</span>
                </span>
                <input
                  type="range"
                  min={40}
                  max={activePlatform.maxTitleLength}
                  value={Math.min(settings.titleLength, activePlatform.maxTitleLength)}
                  onChange={(e) => onChange({ titleLength: Number(e.target.value) })}
                  disabled={disabled}
                  className="mt-2 w-full accent-violet-600"
                />
              </label>

              <label className="min-w-0">
                <span className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Tags Count</span>
                  <span className="text-violet-600">{settings.keywordsCount}</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={activePlatform.maxKeywordsCount}
                  value={Math.min(settings.keywordsCount, activePlatform.maxKeywordsCount)}
                  onChange={(e) => onChange({ keywordsCount: Number(e.target.value) })}
                  disabled={disabled}
                  className="mt-2 w-full accent-violet-600"
                />
              </label>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[11px] font-bold text-slate-500">EXTRA INSTRUCTIONS (optional)</p>
              <textarea
                value={settings.extraInstructions}
                onChange={(e) => onChange({ extraInstructions: e.target.value })}
                disabled={disabled}
                rows={2}
                placeholder="e.g. emphasize minimal style, isolated on white..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-bold text-slate-500">PROMPT STYLE (optional)</p>
            <textarea
              value={settings.extraInstructions}
              onChange={(e) => onChange({ extraInstructions: e.target.value })}
              disabled={disabled}
              rows={3}
              placeholder="Describe the visual style..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        )}

        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold text-slate-500">REQUEST PACE (Rate-Limit Safe)</p>
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
                className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold ${
                  (settings.delayMs ?? 2000) === opt.ms
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
            ✓ Auto key-rotation &amp; rate-limit recovery enabled
          </p>
        </div>
      </div>
    </div>
  );
}
