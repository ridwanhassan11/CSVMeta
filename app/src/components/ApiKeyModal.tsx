"use client";

import { useState } from "react";
import type {
  Provider,
  GenerationSettings,
  GeminiModel,
  MistralModel,
  OpenAIModel,
} from "./ControlsPanel";

interface Props {
  open: boolean;
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  savedKeys: Record<Provider, string[]>;
  addKey: (provider: Provider, key: string) => void;
  removeKey: (provider: Provider, index: number) => void;
  setActiveKey: (provider: Provider, index: number) => void;
  close: () => void;
}

type ProviderMetaEntry = {
  name: string;
  tagline: string;
  badge: string;
  keyUrl: string;
  icon: JSX.Element;
};

const PROVIDER_META: Record<Provider, ProviderMetaEntry> = {
  gemini: {
    name: "Google Gemini",
    tagline: "ছবি বিশ্লেষণ ও টেক্সট জেনারেশনের জন্য Google-এর মডেল",
    badge: "Free & Paid",
    keyUrl: "https://aistudio.google.com/apikey",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </svg>
    ),
  },
  groq: {
    name: "Groq",
    tagline: "অতি দ্রুত ইনফারেন্সের জন্য পরিচিত ওপেন-সোর্স মডেল হোস্টিং",
    badge: "Paid",
    keyUrl: "https://console.groq.com/keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  mistral: {
    name: "Mistral AI",
    tagline: "Pixtral vision মডেল দিয়ে ছবি থেকে মেটাডেটা তৈরি",
    badge: "Paid",
    keyUrl: "https://console.mistral.ai/api-keys/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  openai: {
    name: "OpenAI",
    tagline: "GPT-4o সিরিজ দিয়ে ছবি বিশ্লেষণ ও মেটাডেটা জেনারেশন",
    badge: "Paid",
    keyUrl: "https://platform.openai.com/api-keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    ),
  },
  openrouter: {
    name: "OpenRouter",
    tagline: "একটা key দিয়ে অনেক প্রোভাইডারের মডেলে অ্যাক্সেস",
    badge: "Paid",
    keyUrl: "https://openrouter.ai/keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="M6 8.2V12a2 2 0 0 0 2 2h1.5M18 8.2V12a2 2 0 0 1-2 2h-1.5" />
      </svg>
    ),
  },
};

const GEMINI_MODELS: { id: GeminiModel; label: string }[] = [
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
];

const MISTRAL_MODELS: { id: MistralModel; label: string }[] = [
  { id: "pixtral-large-latest", label: "Pixtral Large" },
  { id: "pixtral-12b-2409", label: "Pixtral 12B" },
];

const OPENAI_MODELS: { id: OpenAIModel; label: string }[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
];

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export default function ApiKeyModal({
  open,
  settings,
  onChange,
  savedKeys,
  addKey,
  removeKey,
  setActiveKey,
  close,
}: Props) {
  const [activeTab, setActiveTab] = useState<Provider>(settings.provider);
  const [keyInput, setKeyInput] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const meta = PROVIDER_META[activeTab];
  const keys = savedKeys[activeTab] || [];

  function toggleReveal(index: number) {
    const k = `${activeTab}-${index}`;
    setRevealed((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function handleAdd() {
    if (!keyInput.trim()) return;
    addKey(activeTab, keyInput.trim());
    setKeyInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl">
        {/* LEFT — provider sidebar */}
        <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
          <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Providers
          </p>
          <div className="space-y-1">
            {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === p
                    ? "bg-[#7C5CFC]/10 text-[#7C5CFC] dark:bg-[#7C5CFC]/20 dark:text-[#B9A7FF]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    activeTab === p
                      ? "bg-[#7C5CFC] text-white"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {PROVIDER_META[p].icon}
                </span>
                {PROVIDER_META[p].name}
                {savedKeys[p]?.length > 0 && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-6 px-2 text-[11px] leading-relaxed text-slate-400">
            আপনার key শুধু আপনার ব্রাউজারে সেভ থাকে, কোথাও পাঠানো হয় না।
          </p>
        </div>

        {/* RIGHT — key management panel */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{meta.name}</h2>
                <span className="rounded-full bg-[#F0A93E]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#B87F0E] dark:text-[#F0A93E]">
                  {meta.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{meta.tagline}</p>
            </div>
            <a
              href={meta.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Get API Key
            </a>
          </div>

          {/* model selector */}
          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-400">MODEL</p>
            {activeTab === "gemini" && (
              <select
                value={settings.geminiModel}
                onChange={(e) => onChange({ geminiModel: e.target.value as GeminiModel })}
                className="w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none appearance-none"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            {activeTab === "mistral" && (
              <select
                value={settings.mistralModel}
                onChange={(e) => onChange({ mistralModel: e.target.value as MistralModel })}
                className="w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none appearance-none"
              >
                {MISTRAL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            {activeTab === "openai" && (
              <select
                value={settings.openaiModel}
                onChange={(e) => onChange({ openaiModel: e.target.value as OpenAIModel })}
                className="w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none appearance-none"
              >
                {OPENAI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            {activeTab === "openrouter" && (
              <input
                type="text"
                value={settings.openrouterModel}
                onChange={(e) => onChange({ openrouterModel: e.target.value })}
                placeholder="e.g. google/gemini-2.5-flash"
                className="w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none"
              />
            )}
            {activeTab === "groq" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                qwen/qwen3.6-27b (fixed)
              </div>
            )}
          </div>

          {/* key input */}
          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-400">API KEY</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={`Enter ${meta.name} API key`}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-[#7C5CFC]"
              />
              <button
                onClick={handleAdd}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFC] text-white hover:bg-[#6a4ce0] transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* stored keys */}
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-semibold text-slate-400">
              STORED KEYS ({keys.length})
            </p>

            {keys.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-6 text-center text-sm text-slate-400">
                এখনো কোনো {meta.name} key যোগ করা হয়নি
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {keys.map((key, index) => {
                  const isRevealed = revealed[`${activeTab}-${index}`];
                  const isActive = index === 0;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="truncate font-mono text-sm text-slate-700 dark:text-slate-200">
                          {isRevealed ? key : maskKey(key)}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => setActiveKey(activeTab, index)}
                            title="এটাকে Active করুন"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => toggleReveal(index)}
                          title="Show/Hide"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isRevealed ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a18.5 18.5 0 0 1 4.22-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => removeKey(activeTab, index)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={close}
              className="rounded-xl bg-slate-900 dark:bg-white px-6 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}