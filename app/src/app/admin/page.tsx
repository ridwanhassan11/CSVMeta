import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

type UserRecord = {
  email: string;
  name: string;
  image: string;
  lastSignIn: string;
};

export default async function AdminPage() {
  const emails = (await redis.smembers("all_users")) as string[];

  const users: UserRecord[] = [];
  for (const email of emails) {
    const data = (await redis.hgetall(`user:${email}`)) as UserRecord | null;
    if (data) users.push(data);
  }

  users.sort((a, b) => new Date(b.lastSignIn).getTime() - new Date(a.lastSignIn).getTime());

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        সাইন-ইন করা ব্যবহারকারীরা ({users.length})
      </h1>

      <div className="space-y-3">
        {users.length === 0 && (
          <p className="text-slate-400">এখনো কেউ সাইন-ইন করেনি।</p>
        )}

        {users.map((u) => (
          <div
            key={u.email}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            {u.image && (
              <img src={u.image} alt={u.name} className="h-10 w-10 rounded-full" />
            )}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
              <p className="text-xs text-slate-400">
                সর্বশেষ সাইন-ইন: {new Date(u.lastSignIn).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}