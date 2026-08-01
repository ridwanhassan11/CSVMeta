"use client";

import type { Provider } from "./ControlsPanel";

interface Props {
  open: boolean;
  provider: Provider;
  apiKey: string;
  savedKeys: string[];
  setApiKey: (value: string) => void;
  addKey: () => void;
  close: () => void;
}

const LABELS: Record<Provider, { name: string; placeholder: string }> = {
  gemini: { name: "Google Gemini", placeholder: "Enter Gemini API key" },
  groq: { name: "Groq", placeholder: "Enter Groq API key" },
};

export default function ApiKeyModal({
  open,
  provider,
  apiKey,
  savedKeys,
  setApiKey,
  addKey,
  close,
}: Props) {
  if (!open) return null;
  const label = LABELS[provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[500px] rounded-3xl bg-white p-8 text-black">
        <h2 className="text-2xl font-bold">{label.name} API Keys</h2>
        <p className="mt-2 text-gray-500">Add your {label.name} key</p>

        <div className="mt-6 flex gap-3">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder={label.placeholder}
            className="flex-1 rounded-xl border p-3"
          />
          <button onClick={addKey} className="rounded-xl bg-black px-5 text-white">
            +
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {savedKeys.length === 0 && (
            <p className="text-sm text-gray-400">No keys added for {label.name} yet.</p>
          )}
          {savedKeys.map((key, index) => (
            <div key={index} className="flex justify-between rounded-xl border p-4">
              <span>...{key.slice(-4)}</span>
              <span className="text-green-600">✓ Added</span>
            </div>
          ))}
        </div>

        <button onClick={close} className="mt-8 rounded-xl bg-black px-8 py-3 text-white">
          Done
        </button>
      </div>
    </div>
  );
}