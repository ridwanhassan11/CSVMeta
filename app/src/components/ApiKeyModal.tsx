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
    tagline: "Free (Experiment) ও Paid tier-এ Mistral Small ও Pixtral vision দিয়ে মেটাডাটা তৈরি",
    badge: "Free & Paid",
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
    tagline: "GPT-4o / GPT-4.1 সিরিজ দিয়ে ছবি বিশ্লেষণ ও মেটাডাটা জেনারেশন",
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
    tagline: "একটি key দিয়ে অনেক প্রোভাইডারের মডেলে অ্যাক্সেস",
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/20">
              ◈
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight">EasyMeta AI Engine &amp; Keys</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                আপনার সব API key শুধু আপনার ব্রাউজারেই সুরক্ষিত থাকে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Horizontal Top Provider Tabs */}
        <div className="border-b border-slate-200/80 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(PROVIDER_META) as Provider[]).map((p) => {
              const count = savedKeys[p]?.length || 0;
              const isSelected = activeTab === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setActiveTab(p);
                    onChange({ provider: p });
                    setTestResult(null);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={isSelected ? "text-white" : "text-indigo-600 dark:text-indigo-400"}>
                      {PROVIDER_META[p].icon}
                    </span>
                    <span className="truncate">{PROVIDER_META[p].name}</span>
                  </span>
                  {count > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
            {/* Left Column: Provider Info + Model + Add Key */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold">{meta.name}</h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {meta.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                      {meta.tagline}
                    </p>
                  </div>
                  <a
                    href={meta.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400"
                  >
                    Get Key ↗
                  </a>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Select Model
                </label>
                {activeTab === "gemini" && (
                  <select
                    value={settings.geminiModel}
                    onChange={(e) => onChange({ geminiModel: e.target.value as GeminiModel })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Add New API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder={`Paste ${meta.name} key here...`}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!keyInput.trim()}
                    className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
                  >
                    + Add Key
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Key Vault */}
            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  Key Vault ({keys.length})
                </p>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Auto-rotates on rate limit
                </span>
              </div>

              {keys.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-xs text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/40">
                  এখনো কোনো {meta.name} key যোগ করা হয়নি। বাঁ পাশে key পেস্ট করে যোগ করুন।
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {keys.map((key, index) => {
                    const isRevealed = revealed[`${activeTab}-${index}`];
                    const isActive = index === activeIdx;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 transition dark:bg-zinc-900 ${
                          isActive
                            ? "border-emerald-300 shadow-2xs dark:border-emerald-800/70"
                            : "border-slate-200/90 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {index + 1}
                          </span>
                          <span className="truncate font-mono text-xs text-slate-700 dark:text-zinc-200">
                            {isRevealed ? key : maskKey(key)}
                          </span>
                          {isActive && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTestKey(key, index)}
                            disabled={testingIndex === index}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            {testingIndex === index ? "Testing…" : "Test"}
                          </button>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => setActiveKey(activeTab, index)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:border-zinc-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                            >
                              Use
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleReveal(index)}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            {isRevealed ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeKey(activeTab, index)}
                            title="Delete key"
                            className="rounded-lg px-1.5 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
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
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/70 px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Active: <b className="text-slate-800 dark:text-zinc-200">{meta.name}</b> ·{" "}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[11px] dark:bg-zinc-800">
              {getSelectedModelForProvider(activeTab, settings)}
            </code>{" "}
            · {keys.length} key(s) saved
          </p>
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
