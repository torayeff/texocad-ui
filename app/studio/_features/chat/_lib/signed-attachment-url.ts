import React from "react";

export function useSignedAttachmentUrl(url: string) {
  const [signedUrl, setSignedUrl] = React.useState(() => url);

  React.useEffect(() => {
    if (!url || url.startsWith("data:") || url.includes("?")) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ url });
    void fetch(`/api/blob?${params.toString()}`)
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
