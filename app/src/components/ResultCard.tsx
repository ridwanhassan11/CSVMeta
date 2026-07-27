"use client";

type Props = {
  loading: boolean;
  title: string;
  description: string;
  keywords: string[];
};

export default function ResultCard({
  loading,
  title,
  description,
  keywords,
}: Props) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-[#121a2d] p-6">

      <h2 className="mb-4 text-xl font-bold">
        Metadata Result
      </h2>

      {loading && (
        <p className="text-slate-400">
          Generating metadata...
        </p>
      )}

      {!loading && (
        <div>

          <div className="mb-5">
            <label className="text-slate-400">
              Title
            </label>

            <textarea
              value={title}
              readOnly
              className="mt-2 w-full rounded-xl bg-[#0b1220] p-4"
            />
          </div>

          <div className="mb-5">
            <label className="text-slate-400">
              Description
            </label>

            <textarea
              value={description}
              readOnly
              className="mt-2 w-full rounded-xl bg-[#0b1220] p-4"
            />
          </div>

          <div className="mb-5">
            <label className="text-slate-400">
              Keywords ({keywords.length})
            </label>

            <textarea
              value={keywords.join(", ")}
              readOnly
              className="mt-2 w-full rounded-xl bg-[#0b1220] p-4"
            />
          </div>

          <div className="mt-5 flex gap-4">

            <button
              onClick={() => navigator.clipboard.writeText(title)}
              className="rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500"
            >
              Copy Title
            </button>

            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  keywords.join(", ")
                )
              }
              className="rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500"
            >
              Copy Keywords
            </button>

          </div>

        </div>
      )}

    </div>
  );
}