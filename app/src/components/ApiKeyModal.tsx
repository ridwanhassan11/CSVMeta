"use client";

import type { Provider } from "./ControlsPanel";

interface Props {
  open: boolean;
  provider: Provider;
  apiKey: string;
  savedKeys: string[];
  setApiKey: (value: string) => void;
  addKey: () => void;
  removeKey: (index: number) => void;
  close: () => void;
}

const LABELS: Record<Provider, { name: string; placeholder: string }> = {
  gemini: { name: "Google Gemini", placeholder: "Enter Gemini API key" },
  groq: { name: "Groq", placeholder: "Enter Groq API key" },
  mistral: { name: "Mistral AI", placeholder: "Enter Mistral API key" },
  openai: { name: "OpenAI", placeholder: "Enter OpenAI API key" },
  openrouter: { name: "OpenRouter", placeholder: "Enter OpenRouter API key" },
};

export default function ApiKeyModal({
  open,
  provider,
  apiKey,
  savedKeys,
  setApiKey,
  addKey,
  removeKey,
  close,
}: Props) {
  if (!open) return null;
  const label = LABELS[provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[500px] rounded-3xl bg-white dark:bg-slate-900 p-8 text-black dark:text-white transition-colors">
        <h2 className="text-2xl font-bold">{label.name} API Keys</h2>
        <p className="mt-2 text-gray-500 dark:text-slate-400">Add your {label.name} key</p>

        <div className="mt-6 flex gap-3">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder={label.placeholder}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
          />
          <button onClick={addKey} className="rounded-xl bg-black dark:bg-white px-5 text-white dark:text-slate-900">
            +
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {savedKeys.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-slate-500">No keys added for {label.name} yet.</p>
          )}
          {savedKeys.map((key, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <span>...{key.slice(-4)}</span>
              <div className="flex items-center gap-3">
                <span className="text-green-600 dark:text-green-400">✓ Added</span>
                <button
                  onClick={() => removeKey(index)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={close} className="mt-8 rounded-xl bg-black dark:bg-white px-8 py-3 text-white dark:text-slate-900">
          Done
        </button>
      </div>
    </div>
  );
}