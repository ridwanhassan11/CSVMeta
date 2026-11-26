"use client";
import { useTheme } from "../hooks/useTheme";
import { signOut } from "next-auth/react";

export type NavItem = "Generate" | "Metadata" | "History" | "Templates" | "Settings";

const ICONS: Record<NavItem, string> = {
  Generate: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  Metadata: "M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  History: "M12 8v4l3 2M21 12a9 9 0 1 1-3-6.7L21 8",
  Templates: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  Settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

function Icon({ name }: { name: NavItem }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function Sidebar({
  active = "Generate",
  onNavigate,
  onOpenKeys,
  doneCount = 0,
  totalCount = 0,
  historyCount = 0,
}: {
  active?: NavItem;
  onNavigate?: (item: NavItem) => void;
  onOpenKeys?: () => void;
  doneCount?: number;
  totalCount?: number;
  historyCount?: number;
}) {
  const items: NavItem[] = ["Generate", "Metadata", "History", "Templates", "Settings"];
  const { theme, toggleTheme } = useTheme();
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[210px] flex-col border-r border-[#e8e1f6] bg-[#f7f4ff] px-[13px] py-5 md:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-1">
        <div className="flex h-11 w-11 items-center justify-center text-[34px] font-black leading-none text-violet-700">
          ◈
        </div>
        <div className="text-[17px] font-extrabold leading-[19px] text-slate-950 dark:text-white">
          CSVMeta
          <br />
          <span className="text-xs font-semibold text-violet-700">AI Generator</span>
        </div>
      </div>

      <nav className="mt-7 space-y-1.5">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate?.(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-[10px] text-left text-[14px] font-semibold transition ${
              item === active
                ? "bg-violet-700 text-white shadow-md shadow-violet-700/20"
                : "text-slate-800 hover:bg-violet-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon name={item} />
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-[#e6def5] bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-violet-700 dark:text-violet-300">
            <span>Session Progress</span>
            <span>{pct}%</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {doneCount} / {totalCount} completed
          </p>
          <div className="mt-2 h-2 rounded-full bg-violet-100 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-violet-700 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            History saved: {historyCount}
          </p>
          {onOpenKeys && (
            <button
              type="button"
              onClick={onOpenKeys}
              className="mt-2.5 w-full rounded-lg bg-violet-700 py-2 text-xs font-bold text-white hover:bg-violet-800"
            >
              ⚙ Manage API Keys
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl border border-[#e6def5] bg-white/60 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <span>☼ {theme === "dark" ? "Dark" : "Light"} Mode</span>
          <span className="rounded-full bg-slate-200 px-2 py-1 dark:bg-slate-700">●</span>
        </button>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e6def5] bg-white/60 px-3 py-3 text-xs text-rose-600 dark:border-slate-700 dark:bg-slate-800"
        >
          ⇥ Log out
        </button>
      </div>
    </aside>
  );
}
