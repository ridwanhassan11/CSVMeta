"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "../hooks/useTheme";
import { signOut } from "next-auth/react";

export type NavItem = "Generate" | "Settings";

const ICONS: Record<NavItem, string> = {
  Generate: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  Settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

function Icon({ name }: { name: NavItem }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 shrink-0"
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
}: {
  active?: NavItem;
  onNavigate?: (item: NavItem) => void;
  onOpenKeys?: () => void;
  doneCount?: number;
  totalCount?: number;
}) {
  const items: NavItem[] = ["Generate", "Settings"];
  const { theme, toggleTheme } = useTheme();
  const [adminInfo, setAdminInfo] = useState<{ isAdmin: boolean; onlineNow?: number }>({
    isAdmin: false,
  });

  useEffect(() => {
    let activeMount = true;
    async function loadAdminStatus() {
      try {
        const res = await fetch("/api/admin/status");
        if (!res.ok) return;
        const data = (await res.json()) as { isAdmin?: boolean; onlineNow?: number };
        if (activeMount && data.isAdmin) {
          setAdminInfo({ isAdmin: true, onlineNow: data.onlineNow });
        }
      } catch {}
    }
    void loadAdminStatus();
    const timer = setInterval(loadAdminStatus, 60_000);
    return () => {
      activeMount = false;
      clearInterval(timer);
    };
  }, []);

  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-slate-200/80 bg-white px-3.5 py-5 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-lg font-black text-white shadow-sm shadow-indigo-600/25">
          ◈
        </div>
        <div>
          <div className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
            EasyMeta
          </div>
          <div className="text-[11px] font-medium text-slate-400 dark:text-zinc-400">
            AI Metadata Studio
          </div>
        </div>
      </div>

      <nav className="mt-7 space-y-1">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate?.(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition ${
              item === active
                ? "bg-slate-900 text-white shadow-sm dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Icon name={item} />
            {item}
          </button>
        ))}

        {adminInfo.isAdmin && (
          <Link
            href="/admin"
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2.5 text-[13px] font-semibold text-indigo-700 transition hover:bg-indigo-100/80 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin Monitor
            </span>
            {typeof adminInfo.onlineNow === "number" && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs dark:bg-zinc-900 dark:text-emerald-400">
                {adminInfo.onlineNow}
              </span>
            )}
          </Link>
        )}
      </nav>

      <div className="mt-auto space-y-2.5">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-200">
            <span>Session Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">{pct}%</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            {doneCount} / {totalCount} completed
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {onOpenKeys && (
            <button
              type="button"
              onClick={onOpenKeys}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-indigo-500"
            >
              ⚙ Manage API Keys
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span>{theme === "dark" ? "☾ Dark Mode" : "☀ Light Mode"}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
            Switch
          </span>
        </button>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/signout-log", { method: "POST" }).catch(() => {});
            await signOut({ callbackUrl: "/login" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-medium text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
