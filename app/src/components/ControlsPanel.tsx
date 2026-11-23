"use client";

export type Provider = "gemini" | "groq" | "mistral" | "openai" | "openrouter";

export type GeminiModel =
  | "gemini-3.8-flash"
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
    <div className="w-full min-w-0 space-y-3">
      <div className="rounded-xl border border-violet-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onOpenKeys} disabled={disabled} className="flex min-w-0 items-center gap-2 text-left">
            <span className="text-lg">⚙</span><span className="truncate text-base font-bold text-slate-900 dark:text-white">Generation Settings</span>
            <span className="truncate text-[11px] text-slate-400">· {PROVIDER_LABELS[settings.provider]}</span>
          </button>
          <span className="text-xs text-slate-400">{getCurrentModelLabel(settings)}</span>
        </div>
        <p className="mb-1.5 text-[11px] font-bold text-slate-500">GENERATION MODE</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onChange({mode:"metadata"})} disabled={disabled} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${settings.mode==="metadata"?"border-violet-600 bg-violet-600 text-white":"border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>▧ Metadata</button>
          <button onClick={() => onChange({mode:"prompt"})} disabled={disabled} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${settings.mode==="prompt"?"border-violet-600 bg-violet-600 text-white":"border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>✧ Image Prompt</button>
        </div>
        {settings.mode==="metadata" ? <>
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-bold text-slate-500">EXPORT PLATFORM</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLATFORMS.map(p=><button key={p.id} onClick={()=>onChange({platform:p.id})} disabled={disabled} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${settings.platform===p.id?"border-violet-600 bg-violet-600 text-white":"border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{p.label}</button>)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="min-w-0"><span className="flex justify-between text-[11px] font-bold text-slate-500"><span>Title Length</span><span className="text-violet-600">{settings.titleLength}</span></span><input type="range" min={40} max={200} value={settings.titleLength} onChange={e=>onChange({titleLength:Number(e.target.value)})} disabled={disabled} className="mt-2 w-full accent-violet-600"/></label>
            <label className="min-w-0"><span className="flex justify-between text-[11px] font-bold text-slate-500"><span>Tags Count</span><span className="text-violet-600">{settings.keywordsCount}</span></span><input type="range" min={10} max={50} value={settings.keywordsCount} onChange={e=>onChange({keywordsCount:Number(e.target.value)})} disabled={disabled} className="mt-2 w-full accent-violet-600"/></label>
          </div>
        </> : <textarea value={settings.extraInstructions} onChange={e=>onChange({extraInstructions:e.target.value})} disabled={disabled} rows={3} placeholder="Describe the visual style..." className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/>}
        <p className="mt-3 rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">✓ Safe sequential generation · one image at a time</p>
      </div>
    </div>
  );
}
