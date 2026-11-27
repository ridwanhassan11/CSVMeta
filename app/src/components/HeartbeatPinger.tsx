"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HeartbeatPinger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    async function ping() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/auth/heartbeat", {
          method: "POST",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { blocked?: boolean; pending?: boolean };
        if (data.blocked && pathname !== "/blocked") {
          window.location.href = "/blocked";
        } else if (data.pending && pathname !== "/pending") {
          window.location.href = "/pending";
        } else if (
          !data.blocked &&
          !data.pending &&
          (pathname === "/pending" || pathname === "/blocked")
        ) {
          window.location.href = "/";
        }
      } catch {}
    }

    void ping();
    const intervalMs = pathname === "/pending" ? 10_000 : 20_000;
    const interval = setInterval(ping, intervalMs);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("focus", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("focus", ping);
    };
  }, [pathname]);

  return null;
}
