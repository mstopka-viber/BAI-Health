"use client";

import { useEffect } from "react";

/**
 * Registers the service worker at `/sw.js` on first client render.
 *
 * Production only — in development we skip registration so Turbopack HMR
 * doesn't fight a cache-first service worker.
 *
 * Renders nothing; lives in the root layout for its side-effect alone.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Registration can fail (HTTP in local tests, quota, etc.) — swallow
        // silently; the app still works without offline support.
      });
  }, []);

  return null;
}
