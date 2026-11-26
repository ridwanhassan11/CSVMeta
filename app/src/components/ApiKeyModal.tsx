"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import {
  GEMINI_MODELS,
  GROQ_MODELS,
  MISTRAL_MODELS,
  OPENAI_MODELS,
  type GenerationSettings,
  type GeminiModel,
  type GroqModel,
  type MistralModel,
  type OpenAIModel,
  type Provider,
} from "@/lib/types";

interface Props {
  open: boolean;
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  savedKeys: Record<Provider, string[]>;
  activeKeys: Partial<Record<Provider, number>>;
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
  icon: ReactElement;
};

const PROVIDER_META: Record<Provider, ProviderMetaEntry> = {
  gemini: {
    name: "Google Gemini",
    tagline: "ছবি বিশ্লেষণ ও টেক্সট জেনারেশনের জন্য Google-এর মডেল",
    badge: "Free & Paid",
    keyUrl: "https://aistudio.google.com/apikey",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </svg>
    ),
  },
  groq: {
    name: "Groq",
    tagline: "অতি দ্রুত ভিশন ও ওপেন-সোর্স মডেল হোস্টিং",
    badge: "Free & Paid",
    keyUrl: "https://console.groq.com/keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  openai: {
    name: "OpenAI",
    tagline: "GPT-4o / GPT-4.1 সিরিজ দিয়ে ছবি বিশ্লেষণ ও মেটাডেটা জেনারেশন",
    badge: "Paid",
    keyUrl: "https://platform.openai.com/api-keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    ),
  },
  openrouter: {
    name: "OpenRouter",
    tagline: "একটা key দিয়ে অনেক প্রোভাইডারের মডেলে অ্যাক্সেস",
    badge: "Free & Paid",
    keyUrl: "https://openrouter.ai/keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="M6 8.2V12a2 2 0 0 0 2 2h1.5M18 8.2V12a2 2 0 0 1-2 2h-1.5" />
      </svg>
    ),
  },
};

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function getSelectedModelForProvider(provider: Provider, settings: GenerationSettings): string {
  switch (provider) {
    case "gemini":
      return settings.geminiModel;
    case "groq":
      return settings.groqModel;
    case "mistral":
      return settings.mistralModel;
    case "openai":
      return settings.openaiModel;
    case "openrouter":
      return settings.openrouterModel;
  }
}

export default function ApiKeyModal({
  open,
  settings,
  onChange,
  savedKeys,
  activeKeys,
  addKey,
  removeKey,
  setActiveKey,
  close,
}: Props) {
  const [activeTab, setActiveTab] = useState<Provider>(settings.provider);
  const [keyInput, setKeyInput] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  if (!open) return null;

  const meta = PROVIDER_META[activeTab];
  const keys = savedKeys[activeTab] || [];
  const activeIdx = Math.min(activeKeys[activeTab] ?? 0, Math.max(0, keys.length - 1));

  function toggleReveal(index: number) {
    const k = `${activeTab}-${index}`;
    setRevealed((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function handleAdd() {
    if (!keyInput.trim()) return;
    addKey(activeTab, keyInput.trim());
    setKeyInput("");
    setTestResult(null);
  }

  async function handleTestKey(key: string, index: number) {
    setTestingIndex(index);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeTab,
          model: getSelectedModelForProvider(activeTab, settings),
          apiKey: key,
        }),
      });
      const json = await res.json();
      setTestResult({
        ok: !!json.ok,
        text: json.ok ? json.message : json.error || "Key test failed",
      });
    } catch {
      setTestResult({ ok: false, text: "Network error while testing key." });
    } finally {
      setTestingIndex(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl md:flex-row dark:bg-slate-900 dark:text-white">
        <div className="w-full shrink-0 border-b border-slate-200 bg-slate-50 p-4 md:w-56 md:border-b-0 md:border-r dark:border-slate-800 dark:bg-slate-950/60">
          <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Providers
          </p>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setActiveTab(p);
                  onChange({ provider: p });
                  setTestResult(null);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === p
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    activeTab === p
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {PROVIDER_META[p].icon}
                </span>
                <span className="truncate">{PROVIDER_META[p].name}</span>
                {savedKeys[p]?.length > 0 && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 hidden px-2 text-[11px] leading-relaxed text-slate-400 md:block">
            আপনার key শুধু আপনার ব্রাউজারে সেভ থাকে। একাধিক key যোগ করলে একটিতে rate limit হলে স্বয়ংক্রিয়ভাবে পরের key ব্যবহার হবে।
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-2">
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
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Get API Key ↗
            </a>
          </div>

          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-400">MODEL</p>
            {activeTab === "gemini" && (
              <select
                value={settings.geminiModel}
                onChange={(e) => onChange({ geminiModel: e.target.value as GeminiModel })}
                className="w-full box-border rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            {activeTab === "groq" && (
              <select
                value={settings.groqModel}
                onChange={(e) => onChange({ groqModel: e.target.value as GroqModel })}
                className="w-full box-border rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {GROQ_MODELS.map((m) => (
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
                className="w-full box-border rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                className="w-full box-border rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                className="w-full box-border rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            )}
          </div>

          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-400">API KEY</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={`Enter ${meta.name} API key`}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700"
                title="Add API Key"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-[11px] font-semibold text-slate-400">
              STORED KEYS ({keys.length})
            </p>

            {keys.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                এখনো কোনো {meta.name} key যোগ করা হয়নি
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {keys.map((key, index) => {
                  const isRevealed = revealed[`${activeTab}-${index}`];
                  const isActive = index === activeIdx;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-700"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="truncate font-mono text-sm text-slate-700 dark:text-slate-200">
                          {isRevealed ? key : maskKey(key)}
                        </span>
                        {isActive && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTestKey(key, index)}
                          disabled={testingIndex === index}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {testingIndex === index ? "Testing..." : "Test"}
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => setActiveKey(activeTab, index)}
                            title="এটাকে Active করুন"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleReveal(index)}
                          title="Show/Hide"
                          className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isRevealed ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeKey(activeTab, index)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {testResult && (
              <p
                className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
                  testResult.ok
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {testResult.text}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
