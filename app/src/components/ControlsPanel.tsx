"use client";

import { useState } from "react";
import type { ReactElement } from "react";

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
    tagline: "অতি দ্রুত ইনফারেন্সের জন্য পরিচিত ওপেন-সোর্স মডেল হোস্টিং",
    badge: "Paid",
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
    tagline: "GPT-4o সিরিজ দিয়ে ছবি বিশ্লেষণ ও মেটাডেটা জেনারেশন",
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
    badge: "Paid",
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

const MISTRAL_MODELS: { id: MistralModel; label: string }[] = [
  { id: "pixtral-large-latest", label: "Pixtral Large, best reasoning" },
  { id: "pixtral-12b-2409", label: "Pixtral 12B, fast" },
];

const OPENAI_MODELS: { id: OpenAIModel; label: string }[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o mini, fast" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
];

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export default function ControlsPanel({
  settings,
  onChange,
  savedKeys,
  addKey,
  removeKey,
  setActiveKey,
  disabled,
}: {
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  savedKeys: Record<Provider, string[]>;
  addKey: (provider: Provider, key: string) => void;
  removeKey: (provider: Provider, index: number) => void;
  setActiveKey: (provider: Provider, index: number) => void;
  disabled?: boolean;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const meta = PROVIDER_META[settings.provider];
  const keys = savedKeys[settings.provider] || [];

  function toggleReveal(index: number) {
    const k = `${settings.provider}-${index}`;
    setRevealed((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function handleAdd() {
    if (!keyInput.trim()) return;
    addKey(settings.provider, keyInput.trim());
    setKeyInput("");
  }

  return (
    <div className="w-full max-w-[340px] shrink-0 space-y-4">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Controls</p>
          <p className="text-xs text-slate-400 mt-0.5">{meta.name}</p>
        </div>

        <select
          value={settings.provider}
          onChange={(e) => onChange({ provider: e.target.value as Provider })}
          disabled={disabled}
          className="mt-3 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 outline-none appearance-none"
        >
          <option value="gemini">Google Gemini</option>
          <option value="groq">Groq, llama-4-maverick</option>
          <option value="mistral">Mistral AI</option>
          <option value="openai">OpenAI</option>
          <option value="openrouter">OpenRouter</option>
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

        {settings.provider === "mistral" && (
          <select
            value={settings.mistralModel}
            onChange={(e) => onChange({ mistralModel: e.target.value as MistralModel })}
            disabled={disabled}
            className="mt-2 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 outline-none appearance-none"
          >
            {MISTRAL_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}

        {settings.provider === "openai" && (
          <select
            value={settings.openaiModel}
            onChange={(e) => onChange({ openaiModel: e.target.value as OpenAIModel })}
            disabled={disabled}
            className="mt-2 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 outline-none appearance-none"
          >
            {OPENAI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}

        {settings.provider === "openrouter" && (
          <input
            type="text"
            value={settings.openrouterModel}
            onChange={(e) => onChange({ openrouterModel: e.target.value })}
            disabled={disabled}
            placeholder="e.g. google/gemini-2.5-flash"
            className="mt-2 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 outline-none"
          />
        )}

        {settings.provider === "groq" && (
          <div className="mt-2 w-full box-border rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            qwen/qwen3.6-27b (fixed)
          </div>
        )}

        {/* 👇 inline API key box */}
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{meta.name}</p>
                <span className="rounded-full bg-[#F0A93E]/15 px-2 py-0.5 text-[10px] font-semibold text-[#B87F0E] dark:text-[#F0A93E] shrink-0">
                  {meta.badge}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{meta.tagline}</p>
            </div>
            
              href={meta.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Get Key
            </a>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold text-slate-400">API KEY</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={`Enter ${meta.name} API key`}
                className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs outline-none focus:border-[#7C5CFC]"
              />
              <button
                onClick={handleAdd}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7C5CFC] text-white hover:bg-[#6a4ce0] transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold text-slate-400">
              STORED KEYS ({keys.length})
            </p>
            {keys.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 py-4 text-center text-[11px] text-slate-400">
                এখনো কোনো {meta.name} key যোগ করা হয়নি
              </p>
            ) : (
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {keys.map((key, index) => {
                  const isRevealed = revealed[`${settings.provider}-${index}`];
                  const isActive = index === 0;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-mono text-[11px] text-slate-700 dark:text-slate-200">
                          {isRevealed ? key : maskKey(key)}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => setActiveKey(settings.provider, index)}
                            title="Active করুন"
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => toggleReveal(index)}
                          title="Show/Hide"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isRevealed ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a18.5 18.5 0 0 1 4.22-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => removeKey(settings.provider, index)}
                          title="Delete"
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
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
        </div>

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