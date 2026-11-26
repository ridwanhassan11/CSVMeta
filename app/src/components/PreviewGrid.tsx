"use client";

import { useMemo, useState } from "react";
import type { ImageItem, ImageStatus } from "../types/image";

const statusStyle: Record<ImageStatus, string> = {
  pending: "bg-slate-100/95 text-slate-600 dark:bg-slate-800/95 dark:text-slate-300",
  loading: "bg-amber-100/95 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200",
  done: "bg-emerald-100/95 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200",
  error: "bg-rose-100/95 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200",
};

const statusLabel: Record<ImageStatus, string> = {
  pending: "Pending",
  loading: "Generating…",
  done: "Done",
  error: "Failed",
};

const fieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-sm text-slate-800 outline-none transition hover:border-slate-200 focus:border-violet-500 focus:bg-white resize-none dark:text-slate-200 dark:hover:border-slate-700 dark:focus:bg-slate-800";

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
      <div className="rounded-2xl border border-[#e8e1f6] bg-white p-3.5 shadow-[0_2px_8px_rgba(91,33,182,.05)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
                    ? "bg-violet-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-300"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-violet-500 sm:w-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-violet-700 dark:text-violet-300">
            {counts.done}/{counts.total} ({pct}%)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e8e1f6] bg-white shadow-[0_2px_8px_rgba(91,33,182,.05)] dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="bg-violet-700 text-xs uppercase tracking-wider text-white">
              <th className="w-12 px-3 py-3 font-semibold">#</th>
              <th className="w-56 px-3 py-3 font-semibold">Image</th>
              <th className="px-3 py-3 font-semibold">Title / Status</th>
              <th className="w-80 px-3 py-3 font-semibold">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ img, index }) => (
              <tr
                key={img.id}
                onClick={() => onSelect(img.id)}
                className={`group cursor-pointer border-t border-slate-100 align-top transition hover:bg-violet-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40 ${
                  selectedId === img.id ? "bg-violet-50/70 dark:bg-violet-950/25" : ""
                }`}
              >
                <td className="px-3 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400">
                  {index + 1}
                </td>

                <td className="px-3 py-3">
                  <div className="relative h-24 w-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${statusStyle[img.status]}`}
                    >
                      {statusLabel[img.status]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(img.id);
                      }}
                      title="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/75 text-[10px] text-white opacity-80 transition hover:bg-rose-600 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1.5 max-w-[192px] truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {img.file.name}
                  </p>
                </td>

                {img.status !== "done" ? (
                  <td colSpan={2} className="px-3 py-4 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{img.file.name}</p>
                    {img.status === "pending" && (
                      <p className="mt-1 text-xs text-slate-400">Waiting in queue…</p>
                    )}
                    {img.status === "loading" && (
                      <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Analyzing image &amp; generating metadata…
                      </p>
                    )}
                    {img.status === "error" && (
                      <p className="mt-1 break-words rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {img.error}
                      </p>
                    )}
                  </td>
                ) : img.prompt !== undefined ? (
                  <td colSpan={2} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-400">GENERATED PROMPT</p>
                      <span className="text-[11px] text-slate-400">
                        {(img.prompt || "").length} chars
                      </span>
                    </div>
                    <textarea
                      value={img.prompt || ""}
                      rows={3}
                      onChange={(e) => onUpdate(img.id, { prompt: e.target.value })}
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => copyWithFeedback(`prompt-${img.id}`, img.prompt || "")}
                      className="mt-2 rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800"
                    >
                      {copiedKey === `prompt-${img.id}` ? "Copied ✓" : "Copy Prompt"}
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={img.title || ""}
                        rows={3}
                        onChange={(e) => onUpdate(img.id, { title: e.target.value })}
                        className={`${fieldClass} font-semibold`}
                      />
                      <div className="mt-1 flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => copyWithFeedback(`title-${img.id}`, img.title || "")}
                          className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400"
                        >
                          {copiedKey === `title-${img.id}` ? "Copied ✓" : "Copy title"}
                        </button>
                        <span className="text-[11px] text-slate-400">
                          {(img.title || "").length} chars
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                        {(img.keywords || []).map((k, i) => (
                          <span
                            key={`${k}-${i}`}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs text-slate-700 dark:bg-violet-900/30 dark:text-slate-200"
                          >
                            {k}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdate(img.id, {
                                  keywords: (img.keywords || []).filter((_, j) => j !== i),
                                })
                              }
                              className="font-bold text-violet-600 hover:text-rose-600 dark:text-violet-300"
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
                            className="w-28 rounded-full border border-violet-300 bg-white px-2.5 py-0.5 text-xs text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-200"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingId(img.id);
                              setNewTag("");
                            }}
                            className="rounded-full px-2 py-0.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-900/30"
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
                          className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400"
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
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-400">
                  No matching images in this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
