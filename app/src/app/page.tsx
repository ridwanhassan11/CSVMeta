"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ControlsPanel, { GenerationSettings, Provider } from "../components/ControlsPanel";
import UploadCard from "../components/UploadCard";
import PreviewGrid from "../components/PreviewGrid";
import ResultCard from "../components/ResultCard";
import ApiKeyModal from "../components/ApiKeyModal";

export type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "loading" | "done" | "error";
  title?: string;
  description?: string;
  keywords?: string[];
  prompt?: string;
  error?: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function compressImage(file: File, maxDimension = 1568, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_SETTINGS: GenerationSettings = {
  provider: "gemini",
  geminiModel: "gemini-3.5-flash",
  mistralModel: "mistral-large-latest",
  openaiModel: "gpt-4o",
  openrouterModel: "google/gemini-2.5-flash",
  mode: "metadata",
  platform: "adobe-stock",
  titleLength: 150,
  keywordsCount: 45,
  extraInstructions: "",
  parallel: false,
};

export default function Home() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const stopRef = useRef(false);

  const [showKeys, setShowKeys] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [savedKeys, setSavedKeys] = useState<Record<Provider, string[]>>({
    gemini: [],
    groq: [],
    mistral: [],
    openai: [],
    openrouter: [],
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("csvmeta_api_keys");
      if (stored) {
        setSavedKeys((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("csvmeta_api_keys", JSON.stringify(savedKeys));
    } catch {
      // ignore
    }
  }, [savedKeys]);

  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  // 👇 রিফ্রেশ দিলেও সেটিংস (provider/model/platform ইত্যাদি) মনে রাখার জন্য
  useEffect(() => {
    try {
      const stored = localStorage.getItem("csvmeta_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("csvmeta_settings", JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  function updateSettings(patch: Partial<GenerationSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  const selectedImage = images.find((img) => img.id === selectedId) || null;
  const doneCount = images.filter((img) => img.status === "done").length;
  const pendingCount = images.filter((img) => img.status !== "done").length;

  function handleFilesSelected(files: File[]) {
    const newImages: ImageItem[] = files.map((file) => ({
      id: makeId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (!selectedId && newImages.length > 0) setSelectedId(newImages[0].id);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function clearAll() {
    setImages([]);
    setSelectedId(null);
  }

  function updateImage(id: string, patch: Partial<ImageItem>) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }

  async function generateOne(img: ImageItem) {
    try {
      updateImage(img.id, { status: "loading", error: undefined });

      const activeKey = savedKeys[settings.provider]?.[0];
      if (!activeKey) {
        updateImage(img.id, {
          status: "error",
          error: `No ${settings.provider} API key added. Click "API Keys" to add one.`,
        });
        return;
      }

      const compressedFile = await compressImage(img.file);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("provider", settings.provider);
      formData.append("geminiModel", settings.geminiModel);
      formData.append("mistralModel", settings.mistralModel);
      formData.append("openaiModel", settings.openaiModel);
      formData.append("openrouterModel", settings.openrouterModel);
      formData.append("apiKey", activeKey);
      formData.append("mode", settings.mode);
      formData.append("platform", settings.platform);
      formData.append("titleLength", String(settings.titleLength));
      formData.append("keywordsCount", String(settings.keywordsCount));
      formData.append("extraInstructions", settings.extraInstructions);

      const res = await fetch("/api/generate", { method: "POST", body: formData });

      let data;
      try {
        data = await res.json();
      } catch {
        updateImage(img.id, {
          status: "error",
          error: `Server error (${res.status}). The image may be too large, try a smaller file.`,
        });
        return;
      }

      if (data.success) {
        if (settings.mode === "prompt") {
          updateImage(img.id, {
            status: "done",
            prompt: data.prompt,
            title: undefined,
            description: undefined,
            keywords: undefined,
          });
        } else {
          updateImage(img.id, {
            status: "done",
            title: data.title,
            description: data.description,
            keywords: data.keywords,
            prompt: undefined,
          });
        }
      } else {
        updateImage(img.id, { status: "error", error: data.error || "Generation failed." });
      }
    } catch (err: any) {
      updateImage(img.id, {
        status: "error",
        error: err?.message || "Unexpected error during generation.",
      });
    }
  }

  async function generateAll() {
    if (images.length === 0) return;

    const toGenerate = images.filter((img) => img.status !== "done");
    if (toGenerate.length === 0) return;

    stopRef.current = false;
    setGenerating(true);

    if (settings.parallel) {
      await Promise.allSettled(toGenerate.map((img) => generateOne(img)));
    } else {
      for (const img of toGenerate) {
        if (stopRef.current) break;
        await generateOne(img);
      }
    }

    setGenerating(false);
  }

  function stopGeneration() {
    stopRef.current = true;
    setGenerating(false);
    setImages((prev) =>
      prev.map((img) => (img.status === "loading" ? { ...img, status: "pending" } : img))
    );
  }

  function exportCSV() {
    const done = images.filter((img) => img.status === "done");
    if (done.length === 0) return;
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;

    if (settings.mode === "prompt") {
      const header = "Filename,Prompt";
      const rows = done.map((img) => [esc(img.file.name), esc(img.prompt || "")].join(","));
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prompts.csv";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const header = "Filename,Title,Description,Keywords";
    const rows = done.map((img) =>
      [esc(img.file.name), esc(img.title || ""), esc(img.description || ""), esc((img.keywords || []).join(", "))].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metadata.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addKey() {
    if (!apiKeyInput.trim()) return;
    setSavedKeys((prev) => ({
      ...prev,
      [settings.provider]: [...prev[settings.provider], apiKeyInput.trim()],
    }));
    setApiKeyInput("");
  }

  function removeKey(index: number) {
    setSavedKeys((prev) => ({
      ...prev,
      [settings.provider]: prev[settings.provider].filter((_, i) => i !== index),
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Sidebar />
      <section className="ml-64 p-8 flex gap-6 items-start">
        <div className="sticky top-8 self-start w-full max-w-[340px] shrink-0">
          <ControlsPanel
            settings={settings}
            onChange={updateSettings}
            onOpenKeys={() => setShowKeys(true)}
            disabled={generating}
          />
        </div>

        <div className="flex-1 min-w-0">
          <UploadCard onFilesSelected={handleFilesSelected} />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              {images.length > 0
                ? `${images.length} file(s) ready${generating ? ` · Generating ${doneCount}/${images.length}` : ""}`
                : "Upload files to begin."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                disabled={generating || images.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Clear All
              </button>

              {generating && (
                <button
                  onClick={stopGeneration}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 px-5 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                  Stop Generate
                </button>
              )}

              <button
                onClick={generateAll}
                disabled={generating || pendingCount === 0}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-40"
              >
                {generating ? (
                  "Generating..."
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                    </svg>
                    {`Generate All (${pendingCount})`}
                  </>
                )}
              </button>
              <button
                onClick={exportCSV}
                disabled={doneCount === 0}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {generating && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-slate-900 dark:bg-white transition-all"
                style={{ width: `${(doneCount / images.length) * 100}%` }}
              />
            </div>
          )}

          <PreviewGrid
            images={images}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={removeImage}
            onUpdate={updateImage}
          />
          <ResultCard image={selectedImage} onUpdate={updateImage} />
        </div>

        <ApiKeyModal
          open={showKeys}
          provider={settings.provider}
          apiKey={apiKeyInput}
          savedKeys={savedKeys[settings.provider]}
          setApiKey={setApiKeyInput}
          addKey={addKey}
          removeKey={removeKey}
          close={() => setShowKeys(false)}
        />
      </section>
    </main>
  );
}