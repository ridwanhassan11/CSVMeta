"use client";

import { useTheme } from "../hooks/useTheme";

type NavItem = "Dashboard";

export default function Sidebar({ active = "Dashboard" }: { active?: NavItem }) {
  const items: NavItem[] = ["Dashboard"];
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
          <img src="/logo-icon.png" alt="CSVMeta logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">CSVMeta</h1>
          <p className="text-xs text-slate-400 mt-1">AI Metadata Platform</p>
        </div>
      </div>

      <nav className="mt-10 space-y-1">
        {items.map((item) => (
          <button
            key={item}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              item === active
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </span>
          <button
            onClick={toggleTheme}
            className={`h-6 w-11 rounded-full transition ${
              theme === "dark" ? "bg-slate-900" : "bg-slate-200"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}