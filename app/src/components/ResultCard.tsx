"use client";

import type { ImageItem } from "../app/page";

type Props = { image: ImageItem | null };

export default function ResultCard({ image }: Props) {
  if (!image) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xl">
          🖼
        </div>
        <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">
          Your generated results will appear here.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Upload some files and click &quot;Generate All&quot; to get started.
        </p>
      </div>
    );
  }

  if (image.status === "error") {
    return (
      <div className="mt-6 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-6">
        <p className="font-semibold text-rose-700 dark:text-rose-400">{image.file.name}</p>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{image.error}</p>
      </div>
    );
  }

  if (image.status !== "done") {
    return (
      <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p className="font-semibold text-slate-900 dark:text-white">{image.file.name}</p>
        <p className="mt-1 text-sm text-slate-400">Generating metadata...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
      <div className="flex items-center gap-3">
        <img
          src={image.previewUrl}
          className="h-14 w-14 rounded-xl object-cover"
          alt={image.file.name}
        />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{image.file.name}</p>
          <p className="text-xs text-slate-400">Ready</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">TITLE</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{image.title}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">DESCRIPTION</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{image.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">KEYWORDS</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {image.keywords?.map((k) => (
              <span
                key={k}
                className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(image.title || "")}
          className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          Copy Title
        </button>
        <button
          onClick={() =>
            navigator.clipboard.writeText(image.keywords?.join(", ") || "")
          }
          className="rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
        >
          Copy Keywords
        </button>
      </div>
    </div>
  );
}