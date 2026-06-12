"use client";

import { useEffect, useState } from "react";

import { anonymousSessionHeaders } from "@/app/lib/chat/anonymous-session";

export function useSignedAttachmentUrl(url: string) {
  const [signedUrl, setSignedUrl] = useState(() => url);

  useEffect(() => {
    if (!url || url.startsWith("data:") || url.includes("?")) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ url });
    void fetch(`/api/blob?${params.toString()}`, {
      headers: anonymousSessionHeaders(),
    })
      .then((response) => response.ok ? response.json() as Promise<{ sasUrl?: string }> : null)
      .then((data) => {
        if (!cancelled) setSignedUrl(data?.sasUrl ?? url);
      })
      .catch(() => {
        if (!cancelled) setSignedUrl(url);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return signedUrl;
}
