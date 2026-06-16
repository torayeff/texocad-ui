"use client";

import { useEffect, useState } from "react";

export function useSignedAttachmentUrl(url: string) {
  const [signedUrl, setSignedUrl] = useState<{ sourceUrl: string; url: string } | null>(null);

  useEffect(() => {
    if (!url || url.startsWith("data:") || url.includes("?")) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ url });
    void fetch(`/api/blob?${params.toString()}`)
      .then((response) => response.ok ? response.json() as Promise<{ sasUrl?: string }> : null)
      .then((data) => {
        if (!cancelled) setSignedUrl({ sourceUrl: url, url: data?.sasUrl ?? url });
      })
      .catch(() => {
        if (!cancelled) setSignedUrl({ sourceUrl: url, url });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return signedUrl?.sourceUrl === url ? signedUrl.url : url;
}
