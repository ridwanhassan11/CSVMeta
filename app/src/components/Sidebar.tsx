export default function Sidebar() {
  return (
    <aside className="fixed left-6 top-6 bottom-6 w-64 rounded-3xl bg-[#121a2d] border border-slate-800 p-6">
      <h1 className="text-3xl font-bold text-blue-400">CSVMeta</h1>

      <p className="mt-2 text-sm text-slate-400">AI Metadata Platform</p>

      <nav className="mt-10 space-y-3">
        <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-left font-medium hover:bg-blue-500">
          Dashboard
        </button>

        <button className="w-full rounded-xl px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
          Generate
        </button>

        <button className="w-full rounded-xl px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
          History
        </button>

        <button className="w-full rounded-xl px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
          Analytics
        </button>

        <button className="w-full rounded-xl px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
          Settings
        </button>
      </nav>
    </aside>
  );
}
