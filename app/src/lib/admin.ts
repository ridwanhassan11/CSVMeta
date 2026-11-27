export function isAdminEmail(email?: string | null): boolean {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(normalized);
}
