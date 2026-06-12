const ANONYMOUS_SESSION_STORAGE_KEY = "texocad-anonymous-session-id";
const ANONYMOUS_SESSION_HEADER = "x-texocad-anonymous-session-id";

let cachedAnonymousSessionId: string | null = null;

export function anonymousSessionId(): string {
  if (cachedAnonymousSessionId) return cachedAnonymousSessionId;
  try {
    const storedId = window.localStorage.getItem(ANONYMOUS_SESSION_STORAGE_KEY);
    if (storedId) {
      cachedAnonymousSessionId = storedId;
      return storedId;
    }
    const sessionId = crypto.randomUUID();
    window.localStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, sessionId);
    cachedAnonymousSessionId = sessionId;
    return sessionId;
  } catch {
    cachedAnonymousSessionId = crypto.randomUUID();
    return cachedAnonymousSessionId;
  }
}

export function anonymousAuthorizationHeader() {
  return `Anonymous ${anonymousSessionId()}`;
}

export function anonymousSessionHeaders(): HeadersInit {
  return {
    [ANONYMOUS_SESSION_HEADER]: anonymousSessionId(),
  };
}
