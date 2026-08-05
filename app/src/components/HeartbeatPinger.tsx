"use client";

import { useEffect } from "react";

export default function HeartbeatPinger() {
  useEffect(() => {
    function ping() {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    }

    ping(); // পেজ লোড হওয়ার সাথে সাথে একবার
    const interval = setInterval(ping, 30_000); // এরপর প্রতি ৩০ সেকেন্ডে

    return () => clearInterval(interval);
  }, []);

  return null;
}