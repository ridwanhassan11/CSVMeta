"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import ControlsPanel from "@/components/ControlsPanel";
import ApiKeyModal from "@/components/ApiKeyModal";
import PreviewGrid from "@/components/PreviewGrid";
import ResultCard from "@/components/ResultCard";
import { downloadPlatformCsv } from "@/lib/csv";
import {
  DEFAULT_SETTINGS,
  PLATFORMS,
  PROVIDER_LABELS,
  type GenerationSettings,
  type Provider,
} from "@/lib/types";
import type { ImageItem } from "@/types/image";

const EMPTY_KEYS: Record<Provider, string[]> = {
  gemini: [],
  groq: [],
  mistral: [],
  openai: [],
  openrouter: [],
};

const KEY_STORAGE = "csvmeta-provider-keys-v1";
const HISTORY_STORAGE = "csvmeta-history-v1";
const SETTINGS_STORAGE = "csvmeta-generation-settings-v1";
const ACTIVE_KEYS_STORAGE = "csvmeta-active-keys-v1";

type HistoryItem = {
  id: string;
  fileName: string;
  title?: string;
  prompt?: string;
  createdAt: string;
};

type GenerateFailure = {
  message: string;
  code: string;
  status: number;
  retryAfterSeconds?: number;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      resolve();
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function decodeImageElement(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Unsupported or corrupted image file."));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareImageForUpload(file: File): Promise<File> {
  let source: (CanvasImageSource & { width: number; height: number }) | null = null;
  let bitmap: ImageBitmap | null = null;

  try {
    try {
      bitmap = await createImageBitmap(file);
      source = bitmap;
    } catch {
      source = await decodeImageElement(file);
    }

    const attemptEncode = async (maxSide: number, quality: number): Promise<Blob> => {
      const scale = Math.min(1, maxSide / Math.max(source!.width, source!.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source!.width * scale));
      canvas.height = Math.max(1, Math.round(source!.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare image for upload.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source!, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Image compression failed."))),
          "image/jpeg",
          quality
        );
      });
    };

    let blob = await attemptEncode(1280, 0.78);
    if (blob.size > 3_500_000) {
      blob = await attemptEncode(1024, 0.65);
    }

    const cleanName = file.name.replace(/\.(png|jpe?g|webp|avif|bmp|gif)$/i, "") + ".jpg";
    return new File([blob], cleanName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap?.close();
  }
}

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLock = useRef(false);
  const stopRequested = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [savedKeys, setSavedKeys] = useState<Record<Provider, string[]>>(EMPTY_KEYS);
  const [activeKeys, setActiveKeys] = useState<Partial<Record<Provider, number>>>({});
  const [keysOpen, setKeysOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<NavItem>("Generate");
  const [hydrated, setHydrated] = useState(false);

  const pushLog = useCallback((msg: string) => {
    setNotice(msg);
    setActivityLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const k = localStorage.getItem(KEY_STORAGE);
        const h = localStorage.getItem(HISTORY_STORAGE);
        const s = localStorage.getItem(SETTINGS_STORAGE);
        const a = localStorage.getItem(ACTIVE_KEYS_STORAGE);
        if (k) setSavedKeys({ ...EMPTY_KEYS, ...JSON.parse(k) });
        if (h) setHistory(JSON.parse(h));
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (a) setActiveKeys(JSON.parse(a));
      } catch {
        setNotice("Could not load saved browser data.");
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY_STORAGE, JSON.stringify(savedKeys));
  }, [hydrated, savedKeys]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(HISTORY_STORAGE, JSON.stringify(history.slice(0, 100)));
  }, [hydrated, history]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
  }, [hydrated, settings]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(ACTIVE_KEYS_STORAGE, JSON.stringify(activeKeys));
  }, [hydrated, activeKeys]);

  const updateSettings = useCallback(
    (patch: Partial<GenerationSettings>) =>
      setSettings((s) => {
        const next = { ...s, ...patch };
        try {
          localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(next));
        } catch {}
        return next;
      }),
    []
  );

  const updateImage = useCallback(
    (id: string, patch: Partial<ImageItem>) =>
      setImages((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    []
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => f.type.startsWith("image/"));
      if (!valid.length) {
        pushLog("শুধুমাত্র PNG, JPG, JPEG বা WEBP ছবি নির্বাচন করুন।");
        return;
      }
      const remainingSlots = Math.max(0, 100 - images.length);
      if (remainingSlots === 0) {
        pushLog("একসাথে সর্বোচ্চ ১০০টি ছবি যোগ করা যায়। কিছু ছবি Clear করে আবার চেষ্টা করুন।");
        return;
      }
      const added = valid.slice(0, remainingSlots).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
      }));
      setImages((xs) => [...xs, ...added]);
      if (valid.length > remainingSlots) {
        pushLog(`${added.length}টি ছবি যোগ হয়েছে (সর্বোচ্চ সীমা ১০০টি)।`);
      } else {
        setNotice(`${added.length}টি ছবি আপলোড হয়েছে।`);
      }
    },
    [images.length, pushLog]
  );

  const removeImage = useCallback((id: string) => {
    setImages((xs) => {
      const target = xs.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return xs.filter((i) => i.id !== id);
    });
    setSelectedId((x) => (x === id ? null : x));
  }, []);

  const requestGenerateOne = useCallback(
    async (
      image: ImageItem,
      apiKey: string,
      signal?: AbortSignal
    ): Promise<{ ok: true } | { ok: false; failure: GenerateFailure }> => {
      updateImage(image.id, { status: "loading", error: undefined });

      try {
        const body = new FormData();
        const uploadFile = await prepareImageForUpload(image.file);
        body.append("file", uploadFile, uploadFile.name);
        body.append("provider", settings.provider);
        body.append("geminiModel", settings.geminiModel);
        body.append("groqModel", settings.groqModel);
        body.append("mistralModel", settings.mistralModel);
        body.append("openaiModel", settings.openaiModel);
        body.append("openrouterModel", settings.openrouterModel);
        body.append("apiKey", apiKey);
        body.append("mode", settings.mode);
        body.append("platform", settings.platform);
        body.append("titleLength", String(settings.titleLength));
        body.append("keywordsCount", String(settings.keywordsCount));
        body.append("extraInstructions", settings.extraInstructions);

        const res = await fetch("/api/generate", { method: "POST", body, signal });
        const responseText = await res.text();

        let result: Record<string, unknown>;
        try {
          result = JSON.parse(responseText);
        } catch {
          return {
            ok: false,
            failure: {
              message: responseText.slice(0, 200) || "Server returned an unreadable response.",
              code: "SERVER_ERROR",
              status: res.status || 500,
            },
          };
        }

        if (!res.ok || !result.success) {
          const retryHeader = res.headers.get("retry-after");
          const retryAfter =
            typeof result.retryAfterSeconds === "number"
              ? result.retryAfterSeconds
              : retryHeader
                ? Number(retryHeader)
                : undefined;

          return {
            ok: false,
            failure: {
              message: String(result.error || "Generation failed."),
              code: String(result.code || "PROVIDER_ERROR"),
              status: res.status,
              retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
            },
          };
        }

        updateImage(
          image.id,
          settings.mode === "prompt"
            ? { status: "done", prompt: String(result.prompt || ""), error: undefined }
            : {
                status: "done",
                title: String(result.title || ""),
                description: result.description !== undefined ? String(result.description) : undefined,
                keywords: Array.isArray(result.keywords) ? result.keywords.map(String) : [],
                error: undefined,
              }
        );

        setHistory((h) =>
          [
            {
              id: image.id,
              fileName: image.file.name,
              title: result.title ? String(result.title) : undefined,
              prompt: result.prompt ? String(result.prompt) : undefined,
              createdAt: new Date().toISOString(),
            },
            ...h,
          ].slice(0, 100)
        );

        return { ok: true };
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          updateImage(image.id, { status: "pending", error: undefined });
          return {
            ok: false,
            failure: { message: "Cancelled by user.", code: "ABORTED", status: 0 },
          };
        }
        const msg = e instanceof Error ? e.message : "Image processing failed.";
        return {
          ok: false,
          failure: {
            message: msg,
            code: /fetch|network/i.test(msg) ? "NETWORK_ERROR" : "CLIENT_IMAGE_ERROR",
            status: 0,
          },
        };
      }
    },
    [settings, updateImage]
  );

  const generateAll = async () => {
    if (generationLock.current) return;

    const pending = images.filter((x) => x.status === "pending" || x.status === "error");
    if (!pending.length) {
      pushLog("নতুন ছবি যোগ করুন অথবা failed ছবিগুলো আবার চেষ্টা করুন।");
      return;
    }

    const providerKeys = (savedKeys[settings.provider] || [])
      .map((key, index) => ({ key: key.trim(), index }))
      .filter((x) => x.key.length > 0);

    if (!providerKeys.length) {
      setKeysOpen(true);
      pushLog(`${PROVIDER_LABELS[settings.provider]}-এর অন্তত একটি API key যোগ করুন।`);
      return;
    }

    generationLock.current = true;
    stopRequested.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setBusy(true);

    const disabledKeys = new Set<number>();
    const keyCooldownUntil = new Map<number, number>();
    let startPos = Math.max(
      0,
      providerKeys.findIndex((k) => k.index === (activeKeys[settings.provider] ?? 0))
    );

    let completedInRun = 0;
    let failedInRun = 0;
    let globalStopReason = "";
    const paceMs = settings.delayMs ?? 2000;

    try {
      for (let i = 0; i < pending.length; i++) {
        if (stopRequested.current) break;

        const item = pending[i];
        let imageDone = false;
        let waitCycles = 0;
        const maxWaitCycles = 4;
        let lastImgError = "";

        while (!imageDone && !stopRequested.current) {
          const usableKeys = providerKeys.filter((k) => !disabledKeys.has(k.index));
          if (!usableKeys.length) {
            globalStopReason =
              lastImgError ||
              "সব API key-এর quota শেষ হয়েছে অথবা key সঠিক নয়। API Keys সেটিংস চেক করুন।";
            break;
          }

          let triedReadyKey = false;

          for (let offset = 0; offset < providerKeys.length; offset++) {
            if (stopRequested.current) break;

            const pos = (startPos + offset) % providerKeys.length;
            const candidate = providerKeys[pos];
            if (disabledKeys.has(candidate.index)) continue;

            const coolUntil = keyCooldownUntil.get(candidate.index) || 0;
            if (coolUntil > Date.now()) continue;

            triedReadyKey = true;
            setActiveKeys((cur) => ({ ...cur, [settings.provider]: candidate.index }));
            setNotice(
              `ছবি ${i + 1}/${pending.length} · Key ${candidate.index + 1}/${providerKeys.length}: ${item.file.name}`
            );

            const res = await requestGenerateOne(item, candidate.key, controller.signal);
            if (res.ok) {
              imageDone = true;
              completedInRun++;
              startPos = pos;
              break;
            }

            const fail = res.failure;
            lastImgError = fail.message;

            if (fail.code === "ABORTED") {
              stopRequested.current = true;
              break;
            }

            if (fail.code === "INVALID_API_KEY") {
              disabledKeys.add(candidate.index);
              pushLog(`Key ${candidate.index + 1} invalid: ${fail.message}`);
              continue;
            }

            if (fail.code === "QUOTA_EXHAUSTED") {
              disabledKeys.add(candidate.index);
              pushLog(`Key ${candidate.index + 1} quota শেষ: ${fail.message}`);
              continue;
            }

            if (fail.code === "MODEL_NOT_FOUND") {
              globalStopReason = fail.message;
              disabledKeys.add(candidate.index);
              break;
            }

            if (fail.code === "CONTENT_BLOCKED" || fail.code === "CLIENT_IMAGE_ERROR") {
              // Skip only this image and continue with remaining images
              updateImage(item.id, { status: "error", error: fail.message });
              failedInRun++;
              imageDone = true;
              pushLog(`${item.file.name} স্কিপ করা হয়েছে: ${fail.message}`);
              break;
            }

            if (fail.code === "RATE_LIMITED" || fail.status === 429) {
              const waitSec = Math.min(60, Math.max(8, fail.retryAfterSeconds ?? 15));
              keyCooldownUntil.set(candidate.index, Date.now() + waitSec * 1000);
              startPos = (pos + 1) % providerKeys.length;
              continue;
            }

            if (fail.code === "INVALID_JSON" || fail.status >= 500 || fail.code === "NETWORK_ERROR") {
              // Retry once on another key or short pause, otherwise fail just this image and move on
              keyCooldownUntil.set(candidate.index, Date.now() + 3000);
              continue;
            }

            // Other 4xx image-specific errors: mark this image error and move to next image
            updateImage(item.id, { status: "error", error: fail.message });
            failedInRun++;
            imageDone = true;
            break;
          }

          if (imageDone || stopRequested.current || globalStopReason) break;

          // Check if any usable key still exists
          const stillUsable = providerKeys.filter((k) => !disabledKeys.has(k.index));
          if (!stillUsable.length) {
            globalStopReason =
              lastImgError ||
              "সব API key-এর quota শেষ হয়েছে অথবা invalid। নতুন key যোগ করুন বা অন্য provider বেছে নিন।";
            break;
          }

          waitCycles++;
          if (waitCycles > maxWaitCycles) {
            updateImage(item.id, {
              status: "error",
              error: lastImgError || "একটানা কয়েকবার চেষ্টা করেও এই ছবিটি জেনারেট হয়নি।",
            });
            failedInRun++;
            pushLog(`${item.file.name} ব্যর্থ হয়েছে, পরের ছবিতে যাওয়া হচ্ছে...`);
            break;
          }

          const soonestReady = Math.min(
            ...stillUsable.map((k) => keyCooldownUntil.get(k.index) || Date.now())
          );
          const waitMs = triedReadyKey
            ? Math.min(20_000, 3_000 * waitCycles)
            : Math.min(60_000, Math.max(4_000, soonestReady - Date.now()));

          pushLog(
            `Rate limit-এর কারণে ${Math.ceil(waitMs / 1000)} সেকেন্ড অপেক্ষা করা হচ্ছে (${waitCycles}/${maxWaitCycles})...`
          );
          await sleep(waitMs, controller.signal);
        }

        if (stopRequested.current || globalStopReason) {
          // Restore unfinished loading item back to pending if stopped globally
          if (item.status === "loading") {
            updateImage(item.id, { status: "pending" });
          }
          break;
        }

        if (i < pending.length - 1 && !stopRequested.current) {
          const effectiveDelay =
            providerKeys.filter((k) => !disabledKeys.has(k.index)).length > 1
              ? Math.min(paceMs, 1000)
              : paceMs;
          await sleep(effectiveDelay, controller.signal);
        }
      }
    } finally {
      const wasStopped = stopRequested.current;
      generationLock.current = false;
      stopRequested.current = false;
      abortControllerRef.current = null;
      setBusy(false);

      if (globalStopReason) {
        pushLog(`থামানো হয়েছে (সফল: ${completedInRun}টি, ব্যর্থ: ${failedInRun}টি) — ${globalStopReason}`);
      } else if (wasStopped) {
        pushLog(`আপনার অনুরোধে বন্ধ করা হয়েছে। সফল: ${completedInRun}টি।`);
      } else if (failedInRun > 0) {
        pushLog(`কাজ শেষ। সফল: ${completedInRun}টি, ব্যর্থ: ${failedInRun}টি (Retry Failed বাটনে আবার চেষ্টা করতে পারবেন)।`);
      } else {
        pushLog(`সব ছবি সফলভাবে তৈরি হয়েছে! মোট সফল: ${completedInRun}টি।`);
      }
    }
  };

  const selected = useMemo(
    () => images.find((x) => x.id === selectedId) || images.find((x) => x.status === "done") || null,
    [images, selectedId]
  );

  const doneCount = useMemo(() => images.filter((x) => x.status === "done").length, [images]);
  const failedCount = useMemo(() => images.filter((x) => x.status === "error").length, [images]);
  const exportableCount = useMemo(
    () => images.filter((x) => x.status === "done" && x.prompt === undefined).length,
    [images]
  );

  const addKey = (p: Provider, key: string) => {
    setSavedKeys((k) => {
      const nextList = [...(k[p] || []), key];
      return { ...k, [p]: nextList };
    });
    setActiveKeys((a) => ({ ...a, [p]: (savedKeys[p] || []).length }));
  };

  const removeKey = (p: Provider, i: number) => {
    setSavedKeys((k) => ({ ...k, [p]: (k[p] || []).filter((_, n) => n !== i) }));
    setActiveKeys((a) => ({ ...a, [p]: 0 }));
  };

  const activePlatformLabel =
    PLATFORMS.find((p) => p.id === settings.platform)?.label || "General";

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-slate-950 dark:bg-slate-950 dark:text-white">
      <Sidebar
        active={activeTab}
        onNavigate={setActiveTab}
        onOpenKeys={() => setKeysOpen(true)}
        doneCount={doneCount}
        totalCount={images.length}
        historyCount={history.length}
      />

      <main className="min-h-screen md:ml-[210px]">
        <div className="mx-auto max-w-[1600px]">
          <header className="sticky top-0 z-20 flex h-[50px] items-center justify-between border-b border-[#eee8f8] bg-[#fbfaff]/95 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <h1 className="text-[17px] font-extrabold">
              <span className="mr-2 text-violet-700">✦</span>
              {activeTab === "Generate" ? "Generate Metadata" : activeTab}
            </h1>

            <div className="flex items-center gap-2 md:hidden">
              {(["Generate", "Metadata", "History", "Settings"] as NavItem[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    activeTab === tab ? "bg-violet-700 text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Help"
                title="Help & Guide"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-slate-800"
              >
                ⓘ
              </button>
              <button
                type="button"
                onClick={() => setLogsOpen(true)}
                aria-label="Notifications"
                title="Activity & Error Logs"
                className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-slate-800"
              >
                ♧
                {activityLogs.length > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-600" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setKeysOpen(true)}
                aria-label="API Keys"
                title="API Keys & Models"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm text-white hover:bg-violet-700"
              >
                ⚙
              </button>
            </div>
          </header>

          <div className="px-3 py-3 md:px-4">
            {activeTab === "History" ? (
              <section className="rounded-2xl border border-violet-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Generation History ({history.length})</h2>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                    >
                      Clear History
                    </button>
                  )}
                </div>
                {history.length ? (
                  history.map((h) => (
                    <article key={h.id + h.createdAt} className="border-b border-slate-100 py-3 dark:border-slate-800">
                      <b className="text-sm">{h.fileName}</b>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.title || h.prompt}</p>
                      <small className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</small>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No history yet.</p>
                )}
              </section>
            ) : activeTab === "Templates" ? (
              <section className="rounded-2xl border border-violet-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 text-lg font-bold">Style &amp; Prompt Templates</h2>
                <p className="mb-4 text-sm text-slate-500">
                  যেকোনো টেমপ্লেটে ক্লিক করলে সেটি আপনার Extra Instructions হিসেবে সেট হয়ে যাবে।
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    "Commercial stock photography, clear subject, natural lighting, copy space",
                    "Minimal composition isolated on clean background, studio lighting",
                    "Editorial lifestyle photography with authentic warm atmosphere",
                    "Flat lay top-down composition, crisp focus, vibrant balanced colors",
                    "High-resolution background texture, seamless clean aesthetic, no text",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        updateSettings({ extraInstructions: t });
                        setActiveTab("Generate");
                        pushLog("টেমপ্লেট সেট করা হয়েছে।");
                      }}
                      className="rounded-xl border border-slate-200 p-4 text-left text-sm hover:border-violet-500 hover:bg-violet-50/50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            ) : activeTab === "Settings" ? (
              <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-bold">Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  সব API key ও সেটিংস শুধু আপনার ব্রাউজারে সেভ থাকে। একাধিক API key যোগ করলে রেট-লিমিটে আটকালে স্বয়ংক্রিয়ভাবে পরের key-তে সুইচ করবে।
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setKeysOpen(true)}
                    className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    Manage API Keys &amp; Models
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings(DEFAULT_SETTINGS);
                      pushLog("সেটিংস ডিফল্টে রিসেট করা হয়েছে।");
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                  >
                    Reset Generation Settings
                  </button>
                </div>
              </section>
            ) : activeTab === "Metadata" ? (
              <section className="rounded-2xl border border-violet-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Generated Metadata ({doneCount} / {images.length})</h2>
                    <p className="text-xs text-slate-500">
                      Target Export Platform: <b>{activePlatformLabel}</b>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("Generate")}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                      + Add / Generate More
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPlatformCsv(images, settings.platform)}
                      disabled={!exportableCount}
                      className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                    >
                      ↓ Export {activePlatformLabel} CSV ({exportableCount})
                    </button>
                  </div>
                </div>
                {images.length > 0 ? (
                  <>
                    <PreviewGrid
                      images={images}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={removeImage}
                      onUpdate={updateImage}
                      notice={notice}
                    />
                    <ResultCard image={selected} onUpdate={updateImage} />
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-slate-500">
                    এখনো কোনো ছবি আপলোড করা হয়নি। Generate ট্যাব থেকে ছবি আপলোড করুন।
                  </p>
                )}
              </section>
            ) : (
              <div className="grid items-start gap-3 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 flex flex-col gap-3 min-[900px]:col-span-2">
                  <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#e8e1f6] bg-white p-2.5 shadow-[0_2px_8px_rgba(91,33,182,.08)] dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("border-violet-600", "bg-violet-50/80");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("border-violet-600", "bg-violet-50/80");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-violet-600", "bg-violet-50/80");
                        const dropped = Array.from(e.dataTransfer.files).filter((file) =>
                          file.type.startsWith("image/")
                        );
                        if (dropped.length) addFiles(dropped);
                      }}
                      className="group relative flex h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-violet-200 bg-[#faf8ff] text-center transition hover:border-violet-500 hover:bg-violet-50 dark:border-violet-900 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                      aria-label="Upload images"
                    >
                      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-violet-700 transition group-hover:scale-105 dark:bg-violet-950 dark:text-violet-300">
                        ⇧
                      </span>
                      <span className="text-base font-bold text-slate-800 dark:text-white">
                        Upload your images
                      </span>
                      <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Drag &amp; drop images here, or click to browse
                      </span>
                      <span className="mt-3 rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white shadow-sm">
                        Choose Images
                      </span>
                      <span className="mt-2 text-xs text-slate-400">
                        PNG, JPG, WEBP • Up to 100 images
                      </span>
                      {images.length > 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white">
                          {images.length} uploaded
                        </span>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        if (files.length) addFiles(files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </section>

                  {notice && (
                    <div
                      role="status"
                      className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {notice}
                    </div>
                  )}

                  <div className={`w-full min-w-0 overflow-hidden ${images.length === 0 ? "hidden" : ""}`}>
                    <PreviewGrid
                      images={images}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={removeImage}
                      onUpdate={updateImage}
                      notice={notice}
                    />
                    {images.length > 0 && <ResultCard image={selected} onUpdate={updateImage} />}
                  </div>
                </div>

                <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#e8e1f6] bg-white p-3.5 shadow-[0_2px_8px_rgba(91,33,182,.08)] min-[900px]:sticky min-[900px]:top-[58px] min-[900px]:self-start dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 dark:text-white">⚙ Generation Settings</h2>
                    <button
                      type="button"
                      onClick={() => setSettings(DEFAULT_SETTINGS)}
                      disabled={busy}
                      className="text-xs font-semibold text-violet-700 disabled:opacity-40"
                    >
                      ↻ Reset
                    </button>
                  </div>

                  <ControlsPanel
                    settings={settings}
                    onChange={updateSettings}
                    onOpenKeys={() => setKeysOpen(true)}
                    disabled={busy}
                  />

                  <button
                    type="button"
                    onClick={generateAll}
                    disabled={!images.length || busy}
                    className="mt-4 w-full rounded-xl bg-violet-700 px-6 py-3 font-bold text-white shadow-md shadow-violet-700/20 hover:bg-violet-800 disabled:opacity-40"
                  >
                    {busy
                      ? "Generating…"
                      : failedCount > 0 && images.every((x) => x.status !== "pending")
                        ? `↻ Retry Failed (${failedCount})`
                        : "✦ Generate Metadata"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (busy) {
                        stopRequested.current = true;
                        abortControllerRef.current?.abort();
                        pushLog("Generation বন্ধ করা হচ্ছে…");
                      }
                    }}
                    disabled={!busy}
                    className="mt-2.5 w-full rounded-xl border border-rose-300 bg-white px-6 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:bg-slate-900 dark:hover:bg-rose-950/30"
                  >
                    ■ Stop Generating
                  </button>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        images.forEach((x) => URL.revokeObjectURL(x.previewUrl));
                        setImages([]);
                        setSelectedId(null);
                        setNotice("");
                      }}
                      disabled={!images.length || busy}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPlatformCsv(images, settings.platform)}
                      disabled={!exportableCount}
                      className="flex-1 rounded-xl bg-violet-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40"
                    >
                      ↓ Export CSV ({exportableCount})
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <ApiKeyModal
        open={keysOpen}
        settings={settings}
        onChange={updateSettings}
        savedKeys={savedKeys}
        activeKeys={activeKeys}
        addKey={addKey}
        removeKey={removeKey}
        setActiveKey={(p, i) => setActiveKeys((a) => ({ ...a, [p]: i }))}
        close={() => setKeysOpen(false)}
      />

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-lg font-bold">CSVMeta ব্যবহার গাইড</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1. <b>API Keys</b> থেকে Google Gemini / Groq / OpenRouter key যোগ করুন এবং <b>Test</b> দিয়ে যাচাই করুন।</li>
              <li>2. Free Tier key-তে কয়েকটি ছবির পর থেমে গেলে <b>Request Pace = Free Tier (4s)</b> সিলেক্ট করুন অথবা একাধিক API key যোগ করুন।</li>
              <li>3. কোনো ১টি ছবি ব্যর্থ হলে পুরো ব্যাচ আর বন্ধ হবে না—সেটি স্কিপ করে বাকি সব ছবি জেনারেট হবে।</li>
              <li>4. <b>Export Platform</b> থেকে Adobe Stock, Shutterstock, Freepik, Vecteezy বা Pond5 বেছে নিয়ে সরাসরি সেই প্ল্যাটফর্মের ফরম্যাটে CSV ডাউনলোড করুন।</li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-xl bg-violet-700 px-5 py-2 text-sm font-semibold text-white"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        </div>
      )}

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Activity &amp; Status Logs</h2>
              {activityLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActivityLogs([])}
                  className="text-xs font-semibold text-rose-600"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-xs text-slate-600 dark:text-slate-300">
              {activityLogs.length ? (
                activityLogs.map((log, idx) => (
                  <p key={idx} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    {log}
                  </p>
                ))
              ) : (
                <p className="py-6 text-center text-slate-400">কোনো লগ নেই।</p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setLogsOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
