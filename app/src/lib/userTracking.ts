import { isAdminEmail } from "@/lib/admin";
import { ensureLiveRedis } from "@/lib/redis";

export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export async function logUserActivity(email: string, type: "signin" | "signout") {
  const redis = await ensureLiveRedis();
  const clean = normalizeEmail(email);
  if (!redis || !clean) return;

  const entry = JSON.stringify({
    type,
    email: clean,
    at: new Date().toISOString(),
  });

  try {
    await Promise.all([
      redis.lpush(`activity:${clean}`, entry).then(() => redis.ltrim(`activity:${clean}`, 0, 199)),
      redis.lpush("activity_log", entry).then(() => redis.ltrim("activity_log", 0, 999)),
    ]);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function recordUserSignIn(params: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const clean = normalizeEmail(params.email);
  const redis = await ensureLiveRedis();
  if (!clean || !redis) return;

  try {
    const [existing, siteSettings] = (await Promise.all([
      redis.hgetall(`user:${clean}`),
      redis.hgetall("site_settings"),
    ])) as [Record<string, string> | null, Record<string, string> | null];

    const requireApproval = siteSettings?.requireApproval === "true";
    const alreadyApproved = existing?.approved === "true";
    const approved = isAdminEmail(clean) || alreadyApproved || !requireApproval ? "true" : "false";
    const nowIso = new Date().toISOString();

    await redis.sadd("all_users", clean);
    await redis.hset(`user:${clean}`, {
      email: clean,
      name: params.name || existing?.name || "",
      image: params.image || existing?.image || "",
      approved,
      isSignedIn: "true",
      lastSignIn: nowIso,
      lastActive: nowIso,
    });
    await redis.hincrby(`user:${clean}`, "signInCount", 1);
    await logUserActivity(clean, "signin");
  } catch (err) {
    console.error("Failed to record sign-in:", err);
  }
}

export async function recordUserSignOut(email?: string | null) {
  const clean = normalizeEmail(email);
  const redis = await ensureLiveRedis();
  if (!clean || !redis) return;

  try {
    const existing = (await redis.hgetall(`user:${clean}`)) as Record<string, string> | null;
    const prevSignOutTs = existing?.lastSignOut ? new Date(existing.lastSignOut).getTime() : 0;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    await redis.sadd("all_users", clean);
    await redis.hset(`user:${clean}`, {
      email: clean,
      isSignedIn: "false",
      lastSignOut: nowIso,
    });

    // Avoid duplicate activity_log entry if both pre-logout endpoint and NextAuth event fire
    if (!Number.isFinite(prevSignOutTs) || now - prevSignOutTs > 5000) {
      await logUserActivity(clean, "signout");
    }
  } catch (err) {
    console.error("Failed to record sign-out:", err);
  }
}

export async function recordUserHeartbeat(params: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  location?: string;
}): Promise<{ blocked: boolean; pending: boolean }> {
  const clean = normalizeEmail(params.email);
  const redis = await ensureLiveRedis();
  if (!clean || !redis) {
    return { blocked: false, pending: false };
  }

  try {
    const [existing, siteSettings] = (await Promise.all([
      redis.hgetall(`user:${clean}`),
      redis.hgetall("site_settings"),
    ])) as [Record<string, string> | null, Record<string, string> | null];

    const requireApproval = siteSettings?.requireApproval === "true";
    const approved =
      isAdminEmail(clean) || existing?.approved === "true" || (!existing && !requireApproval)
        ? "true"
        : existing?.approved || (!requireApproval ? "true" : "false");

    const nowIso = new Date().toISOString();
    const needsSignInBackfill = !existing || !existing.lastSignIn || existing.isSignedIn === "false";

    const update: Record<string, string> = {
      email: clean,
      approved,
      isSignedIn: "true",
      lastActive: nowIso,
    };
    if (params.name) update.name = params.name;
    if (params.image) update.image = params.image;
    if (params.location) update.location = params.location;
    if (needsSignInBackfill) update.lastSignIn = nowIso;

    await redis.sadd("all_users", clean);
    await redis.hset(`user:${clean}`, update);

    if (needsSignInBackfill) {
      await redis.hincrby(`user:${clean}`, "signInCount", 1);
      await logUserActivity(clean, "signin");
    }

    const blocked = existing?.blocked === "true";
    const pending = !isAdminEmail(clean) && !blocked && requireApproval && approved !== "true";
    return { blocked, pending };
  } catch (err) {
    console.error("Failed to record heartbeat:", err);
    return { blocked: false, pending: false };
  }
}
