"use client";

import { useTheme } from "../hooks/useTheme";
import { signOut } from "next-auth/react";

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

      <div className="mt-auto space-y-3">
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

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
