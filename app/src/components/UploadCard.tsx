"use client";

import { useRef } from "react";

export default function UploadCard({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFilesSelected(Array.from(fileList));
  }

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-slate-900 dark:text-white"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="font-semibold text-slate-900 dark:text-white">Upload Files</p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-14 hover:border-slate-300 dark:hover:border-slate-600 transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-lg bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900">
            🖼 Images
          </span>
          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400">
            🎬 Videos · Soon
          </span>
          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400">
            SVG · Soon
          </span>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Drag &amp; drop files here, or <span className="underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          PNG, JPG, JPEG, WEBP, up to 100 images
        </p>
      </div>
    </div>
  );
}
