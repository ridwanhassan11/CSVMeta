"use client";

import { useState } from "react";
import type { ImageItem } from "../types/image";

type Props = {
  image: ImageItem | null;
  onUpdate: (id: string, patch: Partial<ImageItem>) => void;
};

export default function ResultCard({ image, onUpdate }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(field: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField((cur) => (cur === field ? null : cur));
    }, 1500);
  }

  if (!image) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-10 text-center transition-colors dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-zinc-800">
          🖼
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
          Select any completed image to edit details here
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Upload images and click &quot;Generate Metadata&quot; to begin.
        </p>
      </div>
    );
  }

  if (image.status === "error") {
    return (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/40">
        <p className="font-semibold text-rose-700 dark:text-rose-400">{image.file.name}</p>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">{image.error}</p>
      </div>
    );
  }

  if (image.status !== "done") {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-semibold text-slate-900 dark:text-white">{image.file.name}</p>
        <p className="mt-1 text-sm text-slate-400">
          {image.status === "loading" ? "Generating metadata..." : "Waiting in queue..."}
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={image.previewUrl}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            alt={image.file.name}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {image.file.name}
            </p>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              ✓ Ready for export
            </p>
          </div>
        </div>
      </div>

      {image.prompt !== undefined ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">GENERATED PROMPT</p>
            <span className="text-xs text-slate-400">{(image.prompt || "").length} chars</span>
          </div>
          <textarea
            value={image.prompt || ""}
            rows={4}
            onChange={(e) => onUpdate(image.id, { prompt: e.target.value })}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => copy("prompt", image.prompt || "")}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            {copiedField === "prompt" ? "Copied ✓" : "Copy Prompt"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">TITLE</p>
                <span className="text-xs text-slate-400">{(image.title || "").length} chars</span>
              </div>
              <input
                type="text"
                value={image.title || ""}
                onChange={(e) => onUpdate(image.id, { title: e.target.value })}
                className={fieldClass}
              />
            </div>

            {image.description !== undefined && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">DESCRIPTION</p>
                  <span className="text-xs text-slate-400">
                    {(image.description || "").length} chars
                  </span>
                </div>
                <textarea
                  value={image.description || ""}
                  rows={2}
                  onChange={(e) => onUpdate(image.id, { description: e.target.value })}
                  className={fieldClass}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">KEYWORDS</p>
                <span className="text-xs text-slate-400">
                  {(image.keywords || []).length} tags
                </span>
              </div>
              <textarea
                value={(image.keywords || []).join(", ")}
                rows={3}
                onChange={(e) =>
                  onUpdate(image.id, {
                    keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  })
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy("title", image.title || "")}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {copiedField === "title" ? "Copied ✓" : "Copy Title"}
            </button>
            {image.description !== undefined && (
              <button
                type="button"
                onClick={() => copy("desc", image.description || "")}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {copiedField === "desc" ? "Copied ✓" : "Copy Description"}
              </button>
            )}
            <button
              type="button"
              onClick={() => copy("keywords", image.keywords?.join(", ") || "")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {copiedField === "keywords" ? "Copied ✓" : "Copy Keywords"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
