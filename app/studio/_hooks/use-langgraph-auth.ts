"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

const TOKEN_SYNC_INTERVAL_MS = 10_000;

export function useLanggraphAuth() {
  const { getToken, isSignedIn } = useAuth();
  const [token, setToken] = useState<string>();

  useEffect(() => {
    if (!isSignedIn) return;

    let mounted = true;

    const sync = () => {
      getToken().then((t) => {
        if (!mounted || !t) return;
        setToken((prev) => (prev === t ? prev : t));
      });
    };

    sync();
    const id = setInterval(sync, TOKEN_SYNC_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [getToken, isSignedIn]);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );

  const isReady = isSignedIn === true && headers !== undefined;

  return { headers, isReady };
}
