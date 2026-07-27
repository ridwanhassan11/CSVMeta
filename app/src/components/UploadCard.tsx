"use client";

interface UploadCardProps {
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadCard({
  onSelect,
}: UploadCardProps) {
  return (
    <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-700 bg-[#121a2d] p-16 text-center">

      <div className="text-6xl">📤</div>

      <h2 className="mt-4 text-3xl font-bold">
        Upload Images
      </h2>

      <p className="mt-3 text-slate-400">
        Select up to 100 PNG, JPG, JPEG, WEBP or SVG images
      </p>

      <label className="mt-8 inline-flex cursor-pointer rounded-xl bg-blue-600 px-8 py-4 font-medium hover:bg-blue-500">
        Select Images

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onSelect}
        />
      </label>

    </div>
  );
}