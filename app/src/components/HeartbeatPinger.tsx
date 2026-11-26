"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HeartbeatPinger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    function ping() {
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    }

    ping();
    const interval = setInterval(ping, 30_000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
