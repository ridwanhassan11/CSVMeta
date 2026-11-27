"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import ControlsPanel from "@/components/ControlsPanel";
import ApiKeyModal from "@/components/ApiKeyModal";
import PreviewGrid from "@/components/PreviewGrid";
import { downloadPlatformCsv } from "@/lib/csv";
import {
  getAssetType,
  isSupportedAsset,
  prepareAssetForUpload,
  prepareAssetPreview,
} from "@/lib/assetPrep";
import {
  DEFAULT_SETTINGS,
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
const SETTINGS_STORAGE = "csvmeta-generation-settings-v1";
const ACTIVE_KEYS_STORAGE = "csvmeta-active-keys-v1";

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

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLock = useRef(false);
  const uploadLock = useRef(false);
  const stopRequested = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveOrderSeq = useRef(0);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    fileName: string;
  } | null>(null);
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
        const s = localStorage.getItem(SETTINGS_STORAGE);
        const a = localStorage.getItem(ACTIVE_KEYS_STORAGE);
        if (k) setSavedKeys({ ...EMPTY_KEYS, ...JSON.parse(k) });
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
    (id: string, patch: Partial<ImageItem>) => {
      const nextPatch =
        patch.status === "loading" || patch.status === "done" || patch.status === "error"
          ? { ...patch, liveOrder: ++liveOrderSeq.current }
          : patch;
      setImages((xs) => xs.map((x) => (x.id === id ? { ...x, ...nextPatch } : x)));
    },
    []
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (uploadLock.current) {
        pushLog("আগের ফাইলগুলোর আপলোড শেষ হওয়া পর্যন্ত একটু অপেক্ষা করুন।");
        return;
      }
      const valid = files.filter(isSupportedAsset);
      if (!valid.length) {
        pushLog("PNG, JPG, WEBP, SVG বা EPS ফাইল নির্বাচন করুন।");
        return;
      }

      uploadLock.current = true;
      const total = valid.length;
      // Proportional total duration: fast for few files (~0.4-1.5s), scales gently for many, capped at 5.5s
      const targetTotalMs =
        total === 1
          ? 350
          : total <= 12
            ? total * 130
            : Math.min(5500, 1560 + (total - 12) * 38);
      // Small chunks ensure files appear gradually behind the dark overlay
      const chunkSize = total <= 40 ? 1 : total <= 100 ? 2 : 3;
      const totalSteps = Math.ceil(total / chunkSize);
      const targetStepMs = targetTotalMs / totalSteps;

      setUploadProgress({ done: 0, total, fileName: valid[0].name });
      setNotice(`আপলোড হচ্ছে 0/${total}...`);
      // Paint dark upload overlay immediately before decoding images
      await sleep(24);

      try {
        let done = 0;
        for (let i = 0; i < total; i += chunkSize) {
          const slice = valid.slice(i, i + chunkSize);
          const startedAt = performance.now();

          const preparedChunk: ImageItem[] = await Promise.all(
            slice.map(async (file) => {
              const assetType = getAssetType(file);
              let previewUrl = "";
              try {
                previewUrl = await prepareAssetPreview(file);
              } catch {
                previewUrl = assetType === "raster" ? URL.createObjectURL(file) : "";
              }
              return {
                id: crypto.randomUUID(),
                file,
                assetType,
                previewUrl,
                status: "pending" as const,
              };
            })
          );

          done += preparedChunk.length;
          const lastName = slice[slice.length - 1].name;
          setImages((xs) => [...xs, ...preparedChunk]);
          setUploadProgress({ done, total, fileName: lastName });
          setNotice(`আপলোড হচ্ছে ${done}/${total}: ${lastName}`);

          const elapsed = performance.now() - startedAt;
          // Always yield briefly so each gradual batch paints visibly on screen
          const waitMs = Math.max(16, targetStepMs - elapsed);
          await sleep(waitMs);
        }
        setNotice(`${total}টি ফাইল সফলভাবে আপলোড হয়েছে।`);
      } finally {
        uploadLock.current = false;
        setUploadProgress(null);
      }
    },
    [pushLog]
  );

  const removeImage = useCallback((id: string) => {
    setImages((xs) => {
      const target = xs.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return xs.filter((i) => i.id !== id);
    });
    setSelectedId((x) => (x === id ? null : x));
  }, []);

  const requestGenerateBatch = useCallback(
    async (
      batch: ImageItem[],
      apiKey: string,
      signal?: AbortSignal,
      geminiModelOverride?: string
    ): Promise<{ ok: true } | { ok: false; failure: GenerateFailure }> => {
      for (const img of batch) {
        updateImage(img.id, { status: "loading", error: undefined });
      }

      const reqController = new AbortController();
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        reqController.abort();
      }, 65_000);
      const onParentAbort = () => reqController.abort();
      signal?.addEventListener("abort", onParentAbort, { once: true });

      try {
        const body = new FormData();
        const isMulti = batch.length > 1 && settings.mode === "metadata";
        const maxSide = isMulti ? 512 : 768;

        if (isMulti) {
          const metaList: Array<{
            index: number;
            assetType: string;
            assetName: string;
            vectorContext?: string;
          }> = [];
          for (let idx = 0; idx < batch.length; idx++) {
            const img = batch[idx];
            const prepared = await prepareAssetForUpload(img.file, maxSide);
            if (prepared.uploadFile) {
              body.append(`file_${idx}`, prepared.uploadFile, prepared.uploadFile.name);
            }
            metaList.push({
              index: idx,
              assetType: prepared.assetType,
              assetName: img.file.name,
              vectorContext: prepared.vectorContext,
            });
          }
          body.append("batchItems", JSON.stringify(metaList));
        } else {
          const single = batch[0];
          const prepared = await prepareAssetForUpload(single.file, maxSide);
          if (prepared.uploadFile) {
            body.append("file", prepared.uploadFile, prepared.uploadFile.name);
          }
          if (prepared.vectorContext) {
            body.append("vectorContext", prepared.vectorContext);
          }
          body.append("assetType", prepared.assetType);
          body.append("assetName", single.file.name);
        }

        body.append("provider", settings.provider);
        body.append("geminiModel", geminiModelOverride || settings.geminiModel);
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

        const res = await fetch("/api/generate", {
          method: "POST",
          body,
          signal: reqController.signal,
        });
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

        if (isMulti) {
          const items = Array.isArray(result.items)
            ? (result.items as Array<Record<string, unknown>>)
            : [];
          for (let idx = 0; idx < batch.length; idx++) {
            const img = batch[idx];
            const itemRes = items.find((r) => Number(r.index) === idx) || items[idx];
            if (!itemRes) {
              return {
                ok: false,
                failure: {
                  message: "Incomplete batch output; retrying individually.",
                  code: "INVALID_JSON",
                  status: 502,
                },
              };
            }
            const title = String(itemRes.title || "");
            updateImage(img.id, {
              status: "done",
              title,
              description:
                itemRes.description !== undefined ? String(itemRes.description) : undefined,
              keywords: Array.isArray(itemRes.keywords) ? itemRes.keywords.map(String) : [],
              error: undefined,
            });
          }
          return { ok: true };
        }

        const single = batch[0];
        updateImage(
          single.id,
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

        return { ok: true };
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          if (timedOut && !signal?.aborted) {
            return {
              ok: false,
              failure: {
                message: "Request timed out after 65s. Retrying...",
                code: "NETWORK_ERROR",
                status: 408,
              },
            };
          }
          for (const img of batch) {
            updateImage(img.id, { status: "pending", error: undefined });
          }
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
      } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onParentAbort);
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
    const keyModelIndex = new Map<number, number>();
    const geminiFallbackChain = Array.from(
      new Set([
        settings.geminiModel,
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
      ])
    );
    const useSmartFallback = settings.provider === "gemini" && (settings.smartFallback ?? true);

    let startPos = Math.max(
      0,
      providerKeys.findIndex((k) => k.index === (activeKeys[settings.provider] ?? 0))
    );

    let completedInRun = 0;
    let failedInRun = 0;
    let globalStopReason = "";
    const paceMs = settings.delayMs ?? 4500;
    const chunkSize = settings.mode === "prompt" ? 1 : (settings.batchSize ?? 3);

    const queue: ImageItem[][] = [];
    for (let idx = 0; idx < pending.length; idx += chunkSize) {
      queue.push(pending.slice(idx, idx + chunkSize));
    }
    let processedItems = 0;

    try {
      while (queue.length > 0 && !stopRequested.current) {
        const batch = queue.shift()!;
        let batchDone = false;
        let waitCycles = 0;
        const maxWaitCycles = 6;
        let lastImgError = "";
        let lastFailureCode = "";
        let lastFailureStatus = 0;

        while (!batchDone && !stopRequested.current) {
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

            const modelIdx = keyModelIndex.get(candidate.index) ?? 0;
            const activeModel = useSmartFallback
              ? geminiFallbackChain[modelIdx] || settings.geminiModel
              : undefined;

            triedReadyKey = true;
            setActiveKeys((cur) => ({ ...cur, [settings.provider]: candidate.index }));
            const rangeLabel =
              batch.length > 1
                ? `${processedItems + 1}-${processedItems + batch.length}/${pending.length}`
                : `${processedItems + 1}/${pending.length}`;
            setNotice(
              `ফাইল ${rangeLabel} · Key ${candidate.index + 1}/${providerKeys.length}${activeModel ? ` (${activeModel})` : ""}: ${batch[0].file.name}`
            );

            const res = await requestGenerateBatch(
              batch,
              candidate.key,
              controller.signal,
              activeModel
            );
            if (res.ok) {
              batchDone = true;
              completedInRun += batch.length;
              processedItems += batch.length;
              startPos = pos;
              break;
            }

            const fail = res.failure;
            lastImgError = fail.message;
            lastFailureCode = fail.code;
            lastFailureStatus = fail.status;

            if (fail.code === "USER_BLOCKED") {
              stopRequested.current = true;
              window.location.href = "/blocked";
              break;
            }
            if (fail.code === "USER_PENDING") {
              stopRequested.current = true;
              window.location.href = "/pending";
              break;
            }
            if (fail.code === "UNAUTHORIZED") {
              stopRequested.current = true;
              window.location.href = "/login";
              break;
            }

            if (fail.code === "ABORTED") {
              stopRequested.current = true;
              break;
            }

            if (fail.code === "INVALID_API_KEY") {
              disabledKeys.add(candidate.index);
              pushLog(`Key ${candidate.index + 1} invalid: ${fail.message}`);
              continue;
            }

            if (fail.code === "QUOTA_EXHAUSTED" || fail.code === "MODEL_NOT_FOUND") {
              if (useSmartFallback && modelIdx + 1 < geminiFallbackChain.length) {
                const nextModel = geminiFallbackChain[modelIdx + 1];
                keyModelIndex.set(candidate.index, modelIdx + 1);
                pushLog(
                  `Key ${candidate.index + 1}-এ ${activeModel} সীমা/সমস্যা হওয়ায় ${nextModel} মডেলে সুইচ করা হচ্ছে...`
                );
                offset--;
                continue;
              }
              disabledKeys.add(candidate.index);
              pushLog(`Key ${candidate.index + 1} quota শেষ: ${fail.message}`);
              if (fail.code === "MODEL_NOT_FOUND" && !useSmartFallback) {
                globalStopReason = fail.message;
                break;
              }
              continue;
            }

            if (batch.length > 1 && (fail.code === "INVALID_JSON" || fail.code === "CONTENT_BLOCKED" || fail.code === "CLIENT_IMAGE_ERROR" || fail.code === "PROVIDER_ERROR")) {
              // Split failed multi-image batch into single items and retry 1-by-1
              for (const singleItem of batch) {
                updateImage(singleItem.id, { status: "pending", error: undefined });
              }
              queue.unshift(...batch.map((singleItem) => [singleItem]));
              batchDone = true;
              pushLog(`ব্যাচ রেসপন্স অসম্পূর্ণ হওয়ায় ${batch.length}টি ফাইল আলাদাভাবে ১টি করে প্রসেস করা হচ্ছে...`);
              break;
            }

            if (fail.code === "CONTENT_BLOCKED" || fail.code === "CLIENT_IMAGE_ERROR") {
              updateImage(batch[0].id, { status: "error", error: fail.message });
              failedInRun++;
              processedItems++;
              batchDone = true;
              pushLog(`${batch[0].file.name} স্কিপ করা হয়েছে: ${fail.message}`);
              break;
            }

            if (fail.code === "RATE_LIMITED" || fail.status === 429) {
              const waitSec = Math.min(65, Math.max(22, fail.retryAfterSeconds ?? 22));
              keyCooldownUntil.set(candidate.index, Date.now() + waitSec * 1000);
              startPos = (pos + 1) % providerKeys.length;
              continue;
            }

            if (fail.code === "INVALID_JSON" || fail.status >= 500 || fail.code === "NETWORK_ERROR") {
              keyCooldownUntil.set(candidate.index, Date.now() + 3000);
              continue;
            }

            updateImage(batch[0].id, { status: "error", error: fail.message });
            failedInRun++;
            processedItems++;
            batchDone = true;
            break;
          }

          if (batchDone || stopRequested.current || globalStopReason) break;

          const stillUsable = providerKeys.filter((k) => !disabledKeys.has(k.index));
          if (!stillUsable.length) {
            globalStopReason =
              lastImgError ||
              "সব API key-এর quota শেষ হয়েছে অথবা invalid। নতুন key যোগ করুন বা অন্য provider বেছে নিন।";
            break;
          }

          waitCycles++;
          const isRateLimitError =
            lastFailureCode === "RATE_LIMITED" ||
            lastFailureStatus === 429 ||
            /429|rate.?limit/i.test(lastImgError);
          const effectiveMaxCycles = isRateLimitError ? maxWaitCycles : 2;
          if (waitCycles > effectiveMaxCycles) {
            for (const singleItem of batch) {
              updateImage(singleItem.id, {
                status: "error",
                error: lastImgError || "একটানা কয়েকবার চেষ্টা করেও এই ফাইলটি জেনারেট হয়নি।",
              });
              failedInRun++;
              processedItems++;
            }
            pushLog(`${batch[0].file.name} ব্যর্থ হয়েছে: ${lastImgError || "Unknown error"}`);
            break;
          }

          const soonestReady = Math.min(
            ...stillUsable.map((k) => keyCooldownUntil.get(k.index) || Date.now())
          );
          const waitMs = !isRateLimitError
            ? 3_000
            : waitCycles >= 3
              ? 60_000
              : triedReadyKey
                ? Math.min(30_000, 10_000 * waitCycles)
                : Math.min(60_000, Math.max(8_000, soonestReady - Date.now()));

          pushLog(
            isRateLimitError
              ? `API মিনিট-লিমিটের কারণে ${Math.ceil(waitMs / 1000)} সেকেন্ড অপেক্ষা করা হচ্ছে (${waitCycles}/${effectiveMaxCycles})...`
              : `সাময়িক ত্রুটির কারণে ${Math.ceil(waitMs / 1000)} সেকেন্ড পর আবার চেষ্টা করা হচ্ছে (${waitCycles}/${effectiveMaxCycles}): ${lastImgError.slice(0, 120)}`
          );
          await sleep(waitMs, controller.signal);
        }

        if (stopRequested.current || globalStopReason) {
          for (const singleItem of batch) {
            if (singleItem.status === "loading") {
              updateImage(singleItem.id, { status: "pending" });
            }
          }
          break;
        }

        if (queue.length > 0 && !stopRequested.current) {
          const effectiveDelay =
            providerKeys.filter((k) => !disabledKeys.has(k.index)).length > 1
              ? Math.min(paceMs, 1500)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar
        active={activeTab}
        onNavigate={setActiveTab}
        onOpenKeys={() => setKeysOpen(true)}
        doneCount={doneCount}
        totalCount={images.length}
      />

      <main className="min-h-screen md:ml-[220px]">
        <div className="mx-auto max-w-[1600px]">
          <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
            <h1 className="flex items-center gap-2.5 text-[16px] font-bold tracking-tight">
              <Image
                src="/easymeta-logo.png"
                alt="EasyMeta"
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-lg object-cover shadow-xs"
              />
              <span>{activeTab === "Generate" ? "Generate Metadata" : activeTab}</span>
            </h1>

            <div className="flex items-center gap-1.5 md:hidden">
              {(["Generate", "Settings"] as NavItem[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    activeTab === tab
                      ? "bg-slate-900 text-white dark:bg-indigo-600"
                      : "text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-base text-slate-600 dark:text-zinc-300">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Help"
                title="Help & Guide"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                ⓘ
              </button>
              <button
                type="button"
                onClick={() => setLogsOpen(true)}
                aria-label="Notifications"
                title="Activity & Error Logs"
                className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                ♧
                {activityLogs.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600" />
                )}
              </button>
            </div>
          </header>

          <div className="px-4 py-4">
            {activeTab === "Settings" ? (
              <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-bold">Settings</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  সব API key ও সেটিংস শুধু আপনার ব্রাউজারে সেভ থাকে। একাধিক API key যোগ করলে রেট-লিমিটে আটকালে স্বয়ংক্রিয়ভাবে পরের key-তে সুইচ করবে।
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings(DEFAULT_SETTINGS);
                      pushLog("সেটিংস ডিফল্টে রিসেট করা হয়েছে।");
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-zinc-700"
                  >
                    Reset Generation Settings
                  </button>
                </div>
              </section>
            ) : (
              <div className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 flex flex-col gap-3 min-[900px]:col-span-2">
                  <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={Boolean(uploadProgress)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50/70");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/70");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/70");
                        const dropped = Array.from(e.dataTransfer.files).filter(isSupportedAsset);
                        if (dropped.length) void addFiles(dropped);
                      }}
                      className={`group relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 transition hover:border-indigo-400 hover:bg-indigo-50/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/50 dark:hover:border-indigo-500 ${
                        images.length > 0
                          ? "h-[82px] flex-row justify-between px-5 text-left"
                          : "h-[240px] flex-col text-center"
                      }`}
                      aria-label="Upload images and vectors"
                    >
                      {images.length > 0 ? (
                        <>
                          <div className="flex min-w-0 items-center gap-3 pr-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                              ⇧
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                                Add more files ({images.length} loaded)
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                                Drag &amp; drop or click to append PNG, JPG, WEBP, SVG, EPS
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm dark:bg-indigo-600">
                            + Add Files
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-950/60 dark:text-indigo-300">
                            ⇧
                          </span>
                          <span className="text-base font-bold text-slate-800 dark:text-white">
                            Upload your images &amp; vectors
                          </span>
                          <span className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                            Drag &amp; drop files here, or click to browse
                          </span>
                          <span className="mt-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm">
                            Choose Files
                          </span>
                          <span className="mt-2 text-xs text-slate-400">
                            PNG, JPG, WEBP, SVG, EPS • Unlimited batch supported
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.svg,.eps,application/postscript,application/eps,image/svg+xml"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        if (files.length) void addFiles(files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </section>

                  {notice && (
                    <div
                      role="status"
                      className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
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
                  </div>
                </div>

                <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs min-[900px]:sticky min-[900px]:top-[60px] min-[900px]:flex min-[900px]:h-[calc(100vh-74px)] min-[900px]:flex-col min-[900px]:self-start dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-2.5 flex shrink-0 items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Generation Settings
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSettings(DEFAULT_SETTINGS)}
                      disabled={busy}
                      className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-40 dark:text-indigo-400"
                    >
                      ↻ Reset
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-0.5">
                    <ControlsPanel
                      settings={settings}
                      onChange={updateSettings}
                      onOpenKeys={() => setKeysOpen(true)}
                      disabled={busy}
                    />
                  </div>

                  <div className="mt-3 shrink-0 border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={generateAll}
                      disabled={!images.length || busy || !!uploadProgress}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:opacity-95 disabled:opacity-40"
                    >
                      {busy
                        ? "Generating…"
                        : failedCount > 0 && images.every((x) => x.status !== "pending")
                          ? `↻ Retry Failed (${failedCount})`
                          : "✦ Generate Metadata"}
                    </button>

                    <div className="mt-2 flex gap-2">
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
                        className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:bg-zinc-900 dark:hover:bg-rose-950/30"
                      >
                        ■ Stop
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          images.forEach((x) => URL.revokeObjectURL(x.previewUrl));
                          setImages([]);
                          setSelectedId(null);
                          setNotice("");
                        }}
                        disabled={!images.length || busy}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Clear All
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadPlatformCsv(images, settings.platform)}
                      disabled={!exportableCount}
                      className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <h2 className="text-lg font-bold">EasyMeta ব্যবহার গাইড</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-zinc-300">
              <li>1. <b>API Keys</b> থেকে Google Gemini / Groq / Mistral AI / OpenRouter key যোগ করুন এবং <b>Test</b> দিয়ে যাচাই করুন।</li>
              <li>2. Free Tier key-তে কয়েকটি ছবির পর থেমে গেলে <b>Request Pace = Free Tier (4s)</b> সিলেক্ট করুন অথবা একাধিক API key যোগ করুন।</li>
              <li>3. কোনো ১টি ছবি ব্যর্থ হলে পুরো ব্যাচ আর বন্ধ হবে না—সেটি স্কিপ করে বাকি সব ছবি জেনারেট হবে।</li>
              <li>4. <b>Export Platform</b> থেকে Adobe Stock, Shutterstock, Freepik, Vecteezy বা Pond5 বেছে নিয়ে সরাসরি সেই প্ল্যাটফর্মের ফরম্যাটে CSV ডাউনলোড করুন।</li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        </div>
      )}

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
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
            <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-xs text-slate-600 dark:text-zinc-300">
              {activityLogs.length ? (
                activityLogs.map((log, idx) => (
                  <p key={idx} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-zinc-800">
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

      {uploadProgress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-[2px]"
          aria-live="polite"
          role="status"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <span className="inline-block animate-pulse">⇧</span>
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Uploading Files…
                  </h2>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {uploadProgress.fileName}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {uploadProgress.done} / {uploadProgress.total}
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 transition-all duration-150"
                style={{
                  width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              <span>ফাইলগুলো একে একে লোড হচ্ছে…</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round((uploadProgress.done / uploadProgress.total) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
