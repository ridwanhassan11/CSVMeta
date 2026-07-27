"use client";

interface Props {
  open: boolean;
  apiKey: string;
  savedKeys: string[];
  setApiKey: (value: string) => void;
  addKey: () => void;
  close: () => void;
}

export default function ApiKeyModal({
  open,
  apiKey,
  savedKeys,
  setApiKey,
  addKey,
  close,
}: Props) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

      <div className="w-[500px] rounded-3xl bg-white p-8 text-black">

        <h2 className="text-2xl font-bold">
          Google Gemini API Keys
        </h2>

        <p className="mt-2 text-gray-500">
          Add your Gemini API key
        </p>


        <div className="mt-6 flex gap-3">

          <input
            value={apiKey}
            onChange={(e)=>setApiKey(e.target.value)}
            placeholder="Enter Gemini API key"
            className="flex-1 rounded-xl border p-3"
          />

          <button
            onClick={addKey}
            className="rounded-xl bg-black px-5 text-white"
          >
            +
          </button>

        </div>


        <div className="mt-6 space-y-3">

          {savedKeys.map((key,index)=>(

            <div
              key={index}
              className="flex justify-between rounded-xl border p-4"
            >

              <span>
                AIza...{key.slice(-4)}
              </span>

              <span className="text-green-600">
                ✓ Healthy
              </span>

            </div>

          ))}

        </div>


        <button
          onClick={close}
          className="mt-8 rounded-xl bg-black px-8 py-3 text-white"
        >
          Done
        </button>


      </div>

    </div>
  );
}