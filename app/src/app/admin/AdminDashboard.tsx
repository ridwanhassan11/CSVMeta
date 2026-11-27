"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toggleBlockUser,
  setUserApproval,
  setApprovalMode,
  deleteUserAccount,
  getUserActivity,
  type UserRecord,
  type ActivityEntry,
  type RedisStatus,
} from "./actions";

function formatTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(iso?: string) {
  if (!iso) return "অজানা";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "অজানা";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "এইমাত্র";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} মিনিট আগে`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diffSec / 86400)} দিন আগে`;
}

export default function AdminDashboard({
  initialUsers,
  initialActivity,
  initialRequireApproval,
  redisStatus,
}: {
  initialUsers: UserRecord[];
  initialActivity: ActivityEntry[];
  initialRequireApproval: boolean;
  redisStatus: RedisStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "pending" | "active" | "blocked">("all");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [activityCache, setActivityCache] = useState<Record<string, ActivityEntry[]>>({});
  const [manualEmail, setManualEmail] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      if (expandedEmail) {
        void getUserActivity(expandedEmail).then((data) =>
          setActivityCache((prev) => ({ ...prev, [expandedEmail]: data }))
        );
      }
    }, 8_000);
    return () => clearInterval(interval);
  }, [router, expandedEmail]);

  const users = initialUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.location || "").toLowerCase().includes(q);
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "online"
          ? u.online
          : filter === "pending"
            ? !u.approved && !u.blocked
            : filter === "blocked"
              ? u.blocked
              : !u.blocked && u.approved;
    return matchesSearch && matchesFilter;
  });

  const totalUsers = initialUsers.length;
  const blockedCount = initialUsers.filter((u) => u.blocked).length;
  const onlineNow = initialUsers.filter((u) => u.online).length;
  const pendingCount = initialUsers.filter((u) => !u.approved && !u.blocked).length;
  const today = new Date().toDateString();
  const signedInToday = initialUsers.filter(
    (u) => u.lastSignIn && new Date(u.lastSignIn).toDateString() === today
  ).length;

  function runMutation(fn: () => Promise<void>) {
    setActionError("");
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  function handleToggleBlock(email: string, blocked: boolean) {
    runMutation(() => toggleBlockUser(email, blocked));
  }

  function handleApproval(email: string, approved: boolean) {
    runMutation(() => setUserApproval(email, approved));
  }

  function handleApprovalMode(nextMode: boolean) {
    runMutation(() => setApprovalMode(nextMode));
  }

  function handleManualAction(action: "approve" | "block") {
    const clean = manualEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) return;
    runMutation(async () => {
      if (action === "approve") {
        await setUserApproval(clean, true);
      } else {
        await toggleBlockUser(clean, true);
      }
      setManualEmail("");
    });
  }

  function handleDelete(email: string) {
    if (!confirm(`${email} — এই ইউজারকে স্থায়ীভাবে ডিলিট করতে চান?`)) return;
    runMutation(() => deleteUserAccount(email));
  }

  async function handleExpand(email: string) {
    if (expandedEmail === email) {
      setExpandedEmail(null);
      return;
    }
    setExpandedEmail(email);
    const data = await getUserActivity(email);
    setActivityCache((prev) => ({ ...prev, [email]: data }));
  }

  function exportCSV() {
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const header =
      "Name,Email,Location,Session Status,Online,Approved,Blocked,Sign Ins,Last Active,Last Sign In,Last Sign Out";
    const rows = initialUsers.map((u) =>
      [
        esc(u.name),
        esc(u.email),
        esc(u.location || ""),
        u.online ? "Online" : u.signedIn ? "Signed In (Idle)" : "Signed Out",
        u.online ? "Yes" : "No",
        u.approved ? "Yes" : "No",
        u.blocked ? "Yes" : "No",
        String(u.signInCount || 0),
        esc(formatTime(u.lastActive)),
        esc(formatTime(u.lastSignIn)),
        esc(formatTime(u.lastSignOut)),
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csvmeta-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors sm:px-8 sm:py-8 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ← Workspace
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Admin Live Monitor
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-zinc-400">
                কে সাইন ইন/আউট করছে, কতজন অনলাইনে আছে, অনুমতি ও ব্লক কন্ট্রোল (প্রতি ৮ সেকেন্ডে আপডেট হয়)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                router.refresh();
                if (expandedEmail) {
                  void getUserActivity(expandedEmail).then((data) =>
                    setActivityCache((prev) => ({ ...prev, [expandedEmail]: data }))
                  );
                }
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ↻ Refresh
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              ⬇ Export Users CSV
            </button>
          </div>
        </div>

        {!redisStatus.ok && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            <p className="font-semibold">ডাটাবেস (Upstash Redis) সংযুক্ত নেই বা কানেকশন ত্রুটি হয়েছে</p>
            <p className="mt-1 break-all font-mono text-xs opacity-90">{redisStatus.error}</p>
            <p className="mt-2 text-xs opacity-85">
              URL: <b>{redisStatus.hasUrl ? "হ্যাঁ" : "না"}</b> · Token:{" "}
              <b>{redisStatus.hasToken ? "হ্যাঁ" : "না"}</b>
              {redisStatus.host ? (
                <>
                  {" "}
                  · Host:{" "}
                  <code className="rounded bg-rose-100 px-1 py-0.5 dark:bg-rose-900/50">
                    {`${redisStatus.protocol || ""}//${redisStatus.host}`}
                  </code>
                </>
              ) : null}
            </p>
            <p className="mt-1.5 text-xs opacity-80">
              যদি Upstash ডাটাবেসটি ডিলিট/বন্ধ হয়ে গিয়ে থাকে (ENOTFOUND) বা টোকেন ভুল হয়, তাহলে Vercel Dashboard → Storage → Create Database (Upstash Redis) করে নতুন করে প্রজেক্টে Connect করুন এবং Redeploy দিন।
            </p>
          </div>
        )}

        {actionError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {actionError}
          </div>
        )}

        {/* host access controls */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              সাইটে প্রবেশের নিয়ম (Access Control)
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              নতুন কেউ সাইন ইন করলে কীভাবে ঢুকবে?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isPending || !redisStatus.ok}
                onClick={() => handleApprovalMode(false)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition disabled:opacity-50 ${
                  !initialRequireApproval
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                <div>সবাই ঢুকতে পারবে</div>
                <div className="mt-0.5 text-[11px] font-normal opacity-80">
                  Google লগইন করলেই ওপেন (ব্লক ছাড়া)
                </div>
              </button>
              <button
                type="button"
                disabled={isPending || !redisStatus.ok}
                onClick={() => handleApprovalMode(true)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition disabled:opacity-50 ${
                  initialRequireApproval
                    ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                <div>আপনার অনুমতি লাগবে</div>
                <div className="mt-0.5 text-[11px] font-normal opacity-80">
                  আপনি Approve না করলে ঢুকতে পারবে না
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ইমেইল দিয়ে সরাসরি কন্ট্রোল
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              আগেই যেকোনো Gmail অনুমতি দিন বা ব্লক করুন
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="user@gmail.com লিখুন..."
                className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
              />
              <button
                type="button"
                disabled={isPending || !redisStatus.ok || !manualEmail.includes("@")}
                onClick={() => handleManualAction("approve")}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                ✓ অনুমতি দিন
              </button>
              <button
                type="button"
                disabled={isPending || !redisStatus.ok || !manualEmail.includes("@")}
                onClick={() => handleManualAction("block")}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
              >
                ⛔ ব্লক করুন
              </button>
            </div>
          </div>
        </div>

        {/* stats cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Users
            </p>
            <p className="mt-1.5 text-2xl font-bold">{totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-zinc-900">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Online Now
            </p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {onlineNow}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pending Approval
            </p>
            <p className="mt-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Signed In Today
            </p>
            <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {signedInToday}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Blocked
            </p>
            <p className="mt-1.5 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {blockedCount}
            </p>
          </div>
        </div>

        {/* search + filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ইমেইল বা লোকেশন দিয়ে খুঁজুন..."
            className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900"
          />
          <div className="flex flex-wrap rounded-xl border border-slate-200/80 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(
              [
                { id: "all", label: `সবাই (${totalUsers})` },
                { id: "online", label: `অনলাইন (${onlineNow})` },
                { id: "pending", label: `অনুমতির অপেক্ষায় (${pendingCount})` },
                { id: "active", label: "অনুমোদিত" },
                { id: "blocked", label: `ব্লকড (${blockedCount})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.id
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* users table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          {users.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-400">
              এই ফিল্টারে কোনো ইউজার পাওয়া যায়নি।
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {users.map((u) => (
                <div key={u.email}>
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.image || "/logo-icon.png"}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-full border border-slate-200 object-cover dark:border-zinc-700"
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          u.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"
                        }`}
                        title={u.online ? "অনলাইন" : "অফলাইন"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{u.name || "Pre-added User"}</p>
                        {u.online ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ● Online
                          </span>
                        ) : u.signedIn ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            Signed In · {formatRelative(u.lastActive || u.lastSignIn)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                            Signed Out · {formatRelative(u.lastSignOut || u.lastActive || u.lastSignIn)}
                          </span>
                        )}
                        {!u.approved && !u.blocked && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            অনুমতির অপেক্ষায়
                          </span>
                        )}
                        {u.blocked && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {u.email}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        {u.location && <span>📍 {u.location}</span>}
                        <span>লগইন: {formatTime(u.lastSignIn)}</span>
                        {u.signInCount > 0 && <span>মোট লগইন: {u.signInCount} বার</span>}
                        {u.lastSignOut && <span>লগআউট: {formatTime(u.lastSignOut)}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {!u.approved ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApproval(u.email, true)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          ✓ অনুমতি দিন
                        </button>
                      ) : (
                        initialRequireApproval && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleApproval(u.email, false)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            অনুমতি প্রত্যাহার
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => handleExpand(u.email)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {expandedEmail === u.email ? "লুকান" : "হিস্ট্রি"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleBlock(u.email, !u.blocked)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                          u.blocked
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(u.email)}
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-40 dark:bg-rose-950/60 dark:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedEmail === u.email && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        লগইন / সাইন-আউট হিস্ট্রি ({u.email})
                      </p>
                      {!activityCache[u.email] ? (
                        <p className="text-xs text-slate-400">লোড হচ্ছে...</p>
                      ) : activityCache[u.email].length === 0 ? (
                        <p className="text-xs text-slate-400">কোনো হিস্ট্রি পাওয়া যায়নি।</p>
                      ) : (
                        <div className="max-h-48 space-y-1.5 overflow-y-auto">
                          {activityCache[u.email].map((entry, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300"
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
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

        {/* recent activity feed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">সাম্প্রতিক লগইন ও সাইন-আউট ফিড</h2>
            <span className="text-xs text-slate-400">সর্বশেষ ১০০টি ইভেন্ট</span>
          </div>
          {initialActivity.length === 0 ? (
            <p className="text-sm text-slate-400">এখনো কোনো অ্যাক্টিভিটি রেকর্ড হয়নি।</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {initialActivity.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:text-sm dark:bg-zinc-950/60"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      entry.type === "signin" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="font-medium">
                    {entry.type === "signin" ? "সাইন ইন করলো" : "সাইন আউট করলো"}
                  </span>
                  <span className="truncate font-medium text-indigo-600 dark:text-indigo-400">
                    {entry.email}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    {formatTime(entry.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
