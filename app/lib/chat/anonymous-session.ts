let pendingAnonymousSession: Promise<void> | null = null;

export function ensureAnonymousSession() {
  pendingAnonymousSession ??= fetch("/api/anonymous-session", {
    credentials: "same-origin",
    method: "POST",
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Could not start anonymous session.");
    }
  }).finally(() => {
    pendingAnonymousSession = null;
  });

  return pendingAnonymousSession;
}
