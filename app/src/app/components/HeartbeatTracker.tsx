"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { updateHeartbeat } from "@/app/admin/actions";

export default function HeartbeatTracker() {
  const { data: session, status } = useSession();
  const locationSent = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    const email = session.user.email;

    async function tick(withLocation: boolean) {
      let location: string | undefined;

      if (withLocation && !locationSent.current) {
        try {
          const res = await fetch("https://ipapi.co/json/");
          const geo = await res.json();
          if (geo?.city && geo?.country_name) {
            location = `${geo.city}, ${geo.country_name}`;
            locationSent.current = true;
          }
        } catch {
          // location না পেলে চুপচাপ স্কিপ
        }
      }

      updateHeartbeat(email, location).catch(() => {});
    }

    tick(true);
    const interval = setInterval(() => tick(false), 25000);
    return () => clearInterval(interval);
  }, [status, session?.user?.email]);

  return null;
}