"use client";

import { useMemo, useState } from "react";
import type { ImageItem, ImageStatus } from "../types/image";

const statusStyle: Record<ImageStatus, string> = {
  pending: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  loading: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  error: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

const statusLabel: Record<ImageStatus, string> = {
  pending: "Pending",
  loading: "Generating…",
  done: "✓ Done",
  error: "Failed",
};

const fieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-sm text-slate-800 outline-none transition hover:border-slate-200 focus:border-indigo-500 focus:bg-white resize-none dark:text-zinc-200 dark:hover:border-zinc-700 dark:focus:bg-zinc-800";

export default function PreviewGrid({
  images,
  selectedId,
  onSelect,
  onRemove,
  onUpdate,
}: {
  images: ImageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ImageItem>) => void;
  notice?: string;
}) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [filter, setFilter] = useState<"all" | ImageStatus>("all");
  const [query, setQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, { w: number; h: number }>>({});

  const counts = useMemo(() => {
    let done = 0;
    let pending = 0;
    let loading = 0;
    let error = 0;
    for (const img of images) {
      if (img.status === "done") done++;
      else if (img.status === "loading") loading++;
      else if (img.status === "error") error++;
      else pending++;
    }
    return { total: images.length, done, pending, loading, error };
  }, [images]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => {
        if (filter !== "all" && img.status !== filter) return false;
        if (!q) return true;
        return (
          img.file.name.toLowerCase().includes(q) ||
          (img.title || "").toLowerCase().includes(q) ||
          (img.description || "").toLowerCase().includes(q) ||
          (img.prompt || "").toLowerCase().includes(q) ||
          (img.keywords || []).some((k) => k.toLowerCase().includes(q))
        );
      });
  }, [images, filter, query]);

  if (images.length === 0) return null;

  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  function copyWithFeedback(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((cur) => (cur === key ? null : cur));
    }, 1500);
  }

  function commitTag(img: ImageItem) {
    const tag = newTag.trim();
    if (tag) onUpdate(img.id, { keywords: [...(img.keywords || []), tag] });
    setNewTag("");
    setAddingId(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: `All (${counts.total})` },
                { id: "done", label: `Done (${counts.done})` },
                { id: "pending", label: `Pending (${counts.pending + counts.loading})` },
                { id: "error", label: `Failed (${counts.error})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filter === tab.id
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename, title, or tag..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 sm:w-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-zinc-300">
            {counts.done}/{counts.total} ({pct}%)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <th className="w-12 px-3.5 py-3 font-semibold">#</th>
              <th className="w-56 px-3.5 py-3 font-semibold">Image</th>
              <th className="px-3.5 py-3 font-semibold">Title &amp; Details</th>
              <th className="w-80 px-3.5 py-3 font-semibold">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ img, index }) => {
              const dim = dimensions[img.id];
              return (
                <tr
                  key={img.id}
                  onClick={() => onSelect(img.id)}
                  className={`group cursor-pointer border-t border-slate-100 align-top transition hover:bg-slate-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40 ${
                    selectedId === img.id ? "bg-indigo-50/40 dark:bg-indigo-950/15" : ""
                  }`}
                >
                  <td className="px-3.5 py-3.5 text-xs font-bold text-slate-400 dark:text-zinc-500">
                    {index + 1}
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="relative inline-flex min-h-[72px] min-w-[96px] max-w-[208px] items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100/80 dark:border-zinc-700 dark:bg-zinc-800/80">
                      {img.previewUrl ? (
                        <img
                          src={img.previewUrl}
                          alt={img.file.name}
                          loading="lazy"
                          decoding="async"
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            if (el.naturalWidth && el.naturalHeight) {
                              setDimensions((prev) =>
                                prev[img.id]
                                  ? prev
                                  : { ...prev, [img.id]: { w: el.naturalWidth, h: el.naturalHeight } }
                              );
                            }
                          }}
                          className="block h-auto max-h-[180px] w-auto max-w-[208px] object-contain"
                        />
                      ) : (
                        <div className="flex h-24 w-44 items-center justify-center text-xs font-bold text-slate-400">
                          {(img.assetType || "IMG").toUpperCase()}
                        </div>
                      )}
                      {(img.assetType === "eps" || img.assetType === "svg") && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-indigo-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          {img.assetType}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(img.id);
                        }}
                        title="Remove file"
                        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/75 text-[10px] text-white opacity-80 transition hover:bg-rose-600 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                    <p
                      title={img.file.name}
                      className="mt-1.5 max-w-[208px] truncate text-[11px] font-medium text-slate-600 dark:text-zinc-300"
                    >
                      {img.file.name}
                    </p>
                    {dim && (
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {dim.w} × {dim.h} px
                      </p>
                    )}
                  </td>

                  {img.status !== "done" ? (
                    <td colSpan={2} className="px-3.5 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[img.status]}`}
                      >
                        {statusLabel[img.status]}
                      </span>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {img.file.name}
                      </p>
                      {img.status === "pending" && (
                        <p className="mt-1 text-xs text-slate-400">Waiting in queue…</p>
                      )}
                      {img.status === "loading" && (
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Analyzing asset &amp; generating metadata…
                        </p>
                      )}
                      {img.status === "error" && (
                        <p className="mt-1 break-words rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                          {img.error}
                        </p>
                      )}
                    </td>
                  ) : img.prompt !== undefined ? (
                    <td colSpan={2} className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[img.status]}`}
                        >
                          {statusLabel[img.status]}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(img.prompt || "").length} chars
                        </span>
                      </div>
                      <textarea
                        value={img.prompt || ""}
                        rows={4}
                        onChange={(e) => onUpdate(img.id, { prompt: e.target.value })}
                        className={fieldClass}
                      />
                      <button
                        type="button"
                        onClick={() => copyWithFeedback(`prompt-${img.id}`, img.prompt || "")}
                        className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                      >
                        {copiedKey === `prompt-${img.id}` ? "Copied ✓" : "Copy Prompt"}
                      </button>
                    </td>
                  ) : (
                    <>
                      <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[img.status]}`}
                          >
                            {statusLabel[img.status]}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {(img.title || "").length} chars
                          </span>
                        </div>
                        <textarea
                          value={img.title || ""}
                          rows={3}
                          onChange={(e) => onUpdate(img.id, { title: e.target.value })}
                          className={`${fieldClass} font-semibold`}
                        />
                        <button
                          type="button"
                          onClick={() => copyWithFeedback(`title-${img.id}`, img.title || "")}
                          className="ml-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {copiedKey === `title-${img.id}` ? "Copied ✓" : "Copy title"}
                        </button>

                        {img.description !== undefined && (
                          <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-zinc-800">
                            <div className="mb-1 flex items-center justify-between px-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Description
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {(img.description || "").length} chars
                              </span>
                            </div>
                            <textarea
                              value={img.description || ""}
                              rows={2}
                              onChange={(e) => onUpdate(img.id, { description: e.target.value })}
                              className={`${fieldClass} text-xs text-slate-600 dark:text-zinc-300`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                copyWithFeedback(`desc-${img.id}`, img.description || "")
                              }
                              className="ml-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              {copiedKey === `desc-${img.id}` ? "Copied ✓" : "Copy description"}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex max-h-40 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                          {(img.keywords || []).map((k, i) => (
                            <span
                              key={`${k}-${i}`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              {k}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdate(img.id, {
                                    keywords: (img.keywords || []).filter((_, j) => j !== i),
                                  })
                                }
                                className="font-bold text-slate-400 hover:text-rose-600 dark:text-zinc-400"
                                aria-label={`Remove ${k}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {addingId === img.id ? (
                            <input
                              autoFocus
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onBlur={() => commitTag(img)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitTag(img);
                                if (e.key === "Escape") {
                                  setNewTag("");
                                  setAddingId(null);
                                }
                              }}
                              className="w-28 rounded-md border border-indigo-400 bg-white px-2 py-0.5 text-xs text-slate-800 outline-none dark:bg-zinc-800 dark:text-zinc-200"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingId(img.id);
                                setNewTag("");
                              }}
                              className="rounded-md px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                            >
                              + Add Tag
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              copyWithFeedback(`kw-${img.id}`, (img.keywords || []).join(", "))
                            }
                            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {copiedKey === `kw-${img.id}` ? "Copied ✓" : "Copy keywords"}
                          </button>
                          <span className="text-[11px] text-slate-400">
                            {(img.keywords || []).length} tags
                          </span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3.5 py-8 text-center text-sm text-slate-400">
                  No matching files in this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
