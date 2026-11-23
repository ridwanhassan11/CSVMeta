"use client";

import { useTheme } from "../hooks/useTheme";
import { signOut } from "next-auth/react";

type NavItem = "Generate" | "Metadata" | "History" | "Templates" | "Settings";

const ICONS: Record<NavItem, string> = {
  Generate: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  Metadata: "M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  History: "M12 8v4l3 2M21 12a9 9 0 1 1-3-6.7L21 8",
  Templates: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  Settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

function NavIcon({ name }: { name: NavItem }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function Sidebar({ active = "Generate", onNavigate }: { active?: NavItem; onNavigate?: (item: NavItem) => void }) {
  const items: NavItem[] = ["Generate", "Metadata", "History", "Templates", "Settings"];
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[210px] border-r border-slate-200 dark:border-slate-800 bg-[#f7f4ff] dark:bg-slate-900 px-3 py-5 flex flex-col transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
          <img src="/logo-icon.png" alt="Metadata logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Metadata</h1>
          <p className="text-xs text-slate-400 mt-1">AI Metadata Platform</p>
        </div>
      </div>

      <nav className="mt-7 space-y-1">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onNavigate?.(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              item === active
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-slate-800"
            }`}
          >
            <NavIcon name={item} />
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400">
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
              <path d="M2 18 4 6l5 6 3-8 3 8 5-6 2 12z" />
            </svg>
            Free Plan
          </div>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">6,842 / 10,000 rows</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-violet-600" style={{ width: "66%" }} />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">66%</span>
          </div>
          <button className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition">
            Upgrade
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {theme === "dark" ? (
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
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            ) : (
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
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            )}
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <button
            onClick={toggleTheme}
            className={`h-6 w-11 rounded-full transition ${
              theme === "dark" ? "bg-violet-600" : "bg-slate-200"
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
