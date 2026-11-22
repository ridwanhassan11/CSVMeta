"use client";

import { useState } from "react";
import type { ImageItem } from "../app/page";

const statusStyle: Record<ImageItem["status"], string> = {
  pending: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  loading: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  done: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  error: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400",
};

const fieldClass =
  "w-full rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-400 resize-none";

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
}) {
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  if (images.length === 0) return null;

  const doneCount = images.filter((i) => i.status === "done").length;
  const q = query.trim().toLowerCase();
  const rows = images
    .map((img, index) => ({ img, index }))
    .filter(({ img }) => {
      if (!q) return true;
      const text = [img.file.name, img.title, img.description, img.prompt, (img.keywords || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });

  function commitTag(img: ImageItem) {
    const tag = newTag.trim();
    if (tag) onUpdate(img.id, { keywords: [...(img.keywords || []), tag] });
    setNewTag("");
    setAddingId(null);
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-base font-bold text-slate-900 dark:text-white">Generated Metadata</p>
        <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
          Live Preview ({doneCount} / {images.length})
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search metadata..."
          className="ml-auto w-full max-w-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-400"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-violet-600 text-sm text-white">
              <th className="w-12 px-3 py-3 font-semibold">#</th>
              <th className="w-36 px-3 py-3 font-semibold">Image</th>
              <th className="w-56 px-3 py-3 font-semibold">Title</th>
              <th className="px-3 py-3 font-semibold">Tags</th>
              <th className="w-72 px-3 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ img, index }) => (
              <tr
                key={img.id}
                onClick={() => onSelect(img.id)}
                className={`group cursor-pointer border-t border-slate-200 dark:border-slate-800 align-top ${
                  selectedId === img.id ? "bg-violet-50/60 dark:bg-violet-950/20" : ""
                }`}
              >
                <td className="px-3 py-4 text-lg font-bold text-slate-900 dark:text-white">{index + 1}</td>

                <td className="px-3 py-3">
                  <div className="relative h-20 w-28 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover" />
                    <span
                      className={`absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[img.status]}`}
                    >
                      {img.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(img.id);
                      }}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-[10px] text-white group-hover:flex"
                    >
                      ✕
                    </button>
                  </div>
                </td>

                {img.status !== "done" ? (
                  <td colSpan={3} className="px-3 py-4 text-sm">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{img.file.name}</p>
                    {img.status === "pending" && <p className="mt-1 text-slate-400">Waiting to generate...</p>}
                    {img.status === "loading" && (
                      <p className="mt-1 text-amber-600 dark:text-amber-400">Generating...</p>
                    )}
                    {img.status === "error" && (
                      <p className="mt-1 break-words text-rose-600 dark:text-rose-400">{img.error}</p>
                    )}
                  </td>
                ) : img.prompt !== undefined ? (
                  <>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                      <p className="break-words">{img.file.name}</p>
                    </td>
                    <td colSpan={2} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <p className="mb-1 text-[11px] font-semibold text-slate-400">GENERATED PROMPT</p>
                      <textarea
                        value={img.prompt || ""}
                        rows={3}
                        onChange={(e) => onUpdate(img.id, { prompt: e.target.value })}
                        className={fieldClass}
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(img.prompt || "")}
                        className="mt-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                      >
                        Copy Prompt
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={img.title || ""}
                        rows={3}
                        onChange={(e) => onUpdate(img.id, { title: e.target.value })}
                        className={`${fieldClass} font-semibold`}
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(img.title || "")}
                        className="ml-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Copy title
                      </button>
                    </td>

                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(img.keywords || []).map((k, i) => (
                          <span
                            key={`${k}-${i}`}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
                          >
                            {k}
                            <button
                              onClick={() =>
                                onUpdate(img.id, { keywords: (img.keywords || []).filter((_, j) => j !== i) })
                              }
                              className="font-bold text-violet-600 dark:text-violet-300"
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
                            className="w-28 rounded-full border border-violet-300 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setAddingId(img.id);
                              setNewTag("");
                            }}
                            className="rounded-full px-2 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                          >
                            + Add Tag
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText((img.keywords || []).join(", "))}
                        className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Copy keywords
                      </button>
                    </td>

                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={img.description || ""}
                        rows={4}
                        onChange={(e) => onUpdate(img.id, { description: e.target.value })}
                        className={fieldClass}
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
