"use client";

import type { ImageItem } from "../app/page";

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
  if (images.length === 0) return null;

  const statusStyle: Record<ImageItem["status"], string> = {
    pending: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
    loading: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    done: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    error: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400",
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 dark:focus:border-slate-500 resize-none";

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Images ({images.length})</p>

      {images.map((img) => (
        <div
          key={img.id}
          onClick={() => onSelect(img.id)}
          className={`group flex gap-5 rounded-3xl border bg-white dark:bg-slate-900 p-5 cursor-pointer transition-colors ${
            selectedId === img.id ? "border-slate-900 dark:border-white" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
            <img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover" />
            <span
              className={`absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[img.status]}`}
            >
              {img.status}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(img.id);
              }}
              className="absolute top-1.5 right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-[10px] text-white group-hover:flex"
            >
              ✕
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{img.file.name}</p>

            {img.status === "pending" && (
              <p className="mt-2 text-sm text-slate-400">Waiting to generate...</p>
            )}
            {img.status === "loading" && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Generating...</p>
            )}
            {img.status === "error" && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 break-words">{img.error}</p>
            )}

            {img.status === "done" && (
              <div className="mt-2 space-y-3">
                {img.prompt !== undefined ? (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">GENERATED PROMPT</p>
                    <textarea
                      value={img.prompt || ""}
                      rows={3}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(img.id, { prompt: e.target.value })}
                      className={fieldClass}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(img.prompt || "");
                      }}
                      className="mt-2 rounded-lg bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
                    >
                      Copy Prompt
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">TITLE</p>
                      <input
                        type="text"
                        value={img.title || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdate(img.id, { title: e.target.value })}
                        className={fieldClass}
                      />
                    </div>

                    {img.description !== undefined && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">DESCRIPTION</p>
                        <textarea
                          value={img.description || ""}
                          rows={2}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdate(img.id, { description: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">KEYWORDS</p>
                      <textarea
                        value={(img.keywords || []).join(", ")}
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdate(img.id, {
                            keywords: e.target.value
                              .split(",")
                              .map((k) => k.trim())
                              .filter(Boolean),
                          })
                        }
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(img.title || "");
                        }}
                        className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        Copy Title
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText((img.keywords || []).join(", "));
                        }}
                        className="rounded-lg bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
                      >
                        Copy Keywords
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}