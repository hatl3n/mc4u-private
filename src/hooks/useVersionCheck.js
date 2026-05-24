/* global __APP_VERSION__ */
import { useState, useEffect, useCallback } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VERSION_URL = import.meta.env.BASE_URL + "version.json";
const BUILT_VERSION = __APP_VERSION__;

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkVersion = useCallback(async () => {
    // In dev mode Vite handles updates automatically — skip to avoid false positives
    if (import.meta.env.DEV) return;
    try {
      const res = await fetch(VERSION_URL + "?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && data.version !== BUILT_VERSION) {
        setUpdateAvailable(true);
      }
    } catch {
      // Network error — silently ignore, check again later
    }
  }, []);

  useEffect(() => {
    // Check once shortly after mount
    const initialTimer = setTimeout(checkVersion, 5000);

    // Poll on an interval
    const interval = setInterval(checkVersion, POLL_INTERVAL_MS);

    // Also check whenever the user returns to the tab
    const handleFocus = () => checkVersion();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkVersion]);

  return { updateAvailable };
}
