"use client";

import Image from "next/image";

interface PreviewGridProps {
  imageUrl: string | null;
  onRemove: () => void;
}

export default function PreviewGrid({
  imageUrl,
  onRemove,
}: PreviewGridProps) {
  if (!imageUrl) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">
        Image Preview
      </h2>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-[#121a2d]">

        <Image
          src={imageUrl}
          alt="Preview"
          width={600}
          height={400}
          className="h-72 w-full object-cover"
          unoptimized
        />

        <button
          onClick={onRemove}
          className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-500"
        >
          ✕
        </button>

      </div>
    </div>
  );
}