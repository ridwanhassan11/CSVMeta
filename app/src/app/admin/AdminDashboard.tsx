"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleBlockUser,
  deleteUserAccount,
  getUserActivity,
  type UserRecord,
  type ActivityEntry,
} from "./actions";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminDashboard({
  initialUsers,
  initialActivity,
}: {
  initialUsers: UserRecord[];
  initialActivity: ActivityEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "blocked" | "active">("all");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [activityCache, setActivityCache] = useState<Record<string, ActivityEntry[]>>({});

  const users = initialUsers.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ? true : filter === "blocked" ? u.blocked : !u.blocked;
    return matchesSearch && matchesFilter;
  });

  const totalUsers = initialUsers.length;
  const blockedCount = initialUsers.filter((u) => u.blocked).length;
  const onlineNow = initialUsers.filter((u) => u.online).length;
  const today = new Date().toDateString();
  const signedInToday = initialUsers.filter(
    (u) => u.lastSignIn && new Date(u.lastSignIn).toDateString() === today
  ).length;

  function handleToggleBlock(email: string, blocked: boolean) {
    startTransition(async () => {
      await toggleBlockUser(email, blocked);
      router.refresh();
    });
  }

  function handleDelete(email: string) {
    if (!confirm(`${email} — এই ইউজারকে স্থায়ীভাবে ডিলিট করতে চান?`)) return;
    startTransition(async () => {
      await deleteUserAccount(email);
      router.refresh();
    });
  }

  async function handleExpand(email: string) {
    if (expandedEmail === email) {
      setExpandedEmail(null);
      return;
    }
    setExpandedEmail(email);
    if (!activityCache[email]) {
      const data = await getUserActivity(email);
      setActivityCache((prev) => ({ ...prev, [email]: data }));
    }
  }

  function exportCSV() {
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const header = "Name,Email,Location,Online,Last Sign In,Last Sign Out,Blocked";
    const rows = initialUsers.map((u) =>
      [
        esc(u.name),
        esc(u.email),
        esc(u.location || ""),
        u.online ? "Yes" : "No",
        esc(formatTime(u.lastSignIn)),
        esc(formatTime(u.lastSignOut)),
        u.blocked ? "Yes" : "No",
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csvmeta-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-8 transition-colors">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">ইউজার ম্যানেজমেন্ট ও অ্যাক্টিভিটি লগ</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
          >
            ⬇ Export CSV
          </button>
        </div>

        {/* stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-400">TOTAL USERS</p>
            <p className="mt-1 text-2xl font-bold">{totalUsers}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-400">ONLINE NOW</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onlineNow}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-400">BLOCKED</p>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{blockedCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-400">SIGNED IN TODAY</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{signedInToday}</p>
          </div>
        </div>

        {/* search + filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {(["all", "active", "blocked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {f === "all" ? "সবাই" : f === "active" ? "অ্যাক্টিভ" : "ব্লকড"}
              </button>
            ))}
          </div>
        </div>

        {/* users table */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {users.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">কোনো ইউজার পাওয়া যায়নি।</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <div key={u.email}>
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <div className="relative shrink-0">
                      <img
                        src={u.image || "/logo-icon.png"}
                        alt={u.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          u.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                        title={u.online ? "অনলাইন" : "অফলাইন"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm">{u.name || "নাম নেই"}</p>
                        {u.blocked && (
                          <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                            Blocked
                          </span>
                        )}
                        {u.online && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Online
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>

                    <div className="text-xs text-slate-400 shrink-0 hidden md:block">
                      {u.location && <p className="mb-0.5">📍 {u.location}</p>}
                      <p>সর্বশেষ লগইন: {formatTime(u.lastSignIn)}</p>
                      <p>সর্বশেষ লগআউট: {formatTime(u.lastSignOut)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleExpand(u.email)}
                        className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {expandedEmail === u.email ? "লুকান" : "হিস্ট্রি"}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleBlock(u.email, !u.blocked)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                          u.blocked
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
                        }`}
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(u.email)}
                        className="rounded-lg bg-rose-100 dark:bg-rose-900/40 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-200 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedEmail === u.email && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 px-4 pb-4">
                      <p className="mb-2 text-[11px] font-semibold text-slate-400">
                        অ্যাক্টিভিটি হিস্ট্রি
                      </p>
                      {!activityCache[u.email] ? (
                        <p className="text-sm text-slate-400">লোড হচ্ছে...</p>
                      ) : activityCache[u.email].length === 0 ? (
                        <p className="text-sm text-slate-400">কোনো হিস্ট্রি পাওয়া যায়নি।</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {activityCache[u.email].map((entry, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  entry.type === "signin" ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              <span className="font-medium">
                                {entry.type === "signin" ? "সাইন ইন" : "সাইন আউট"}
                              </span>
                              <span className="text-slate-400">{formatTime(entry.at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* global activity feed */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="mb-3 text-sm font-semibold">সাম্প্রতিক অ্যাক্টিভিটি (সবার)</p>
          {initialActivity.length === 0 ? (
            <p className="text-sm text-slate-400">এখনো কোনো অ্যাক্টিভিটি রেকর্ড হয়নি।</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {initialActivity.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      entry.type === "signin" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="font-medium">
                    {entry.type === "signin" ? "সাইন ইন করলো" : "সাইন আউট করলো"}
                  </span>
                  <span className="truncate text-slate-500 dark:text-slate-400">{entry.email}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400">{formatTime(entry.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}