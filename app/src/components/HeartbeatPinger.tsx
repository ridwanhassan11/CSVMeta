"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HeartbeatPinger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    function ping() {
      if (document.visibilityState === "hidden") return;
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    }

    ping();
    const interval = setInterval(ping, 45_000);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [pathname]);

  return null;
}
