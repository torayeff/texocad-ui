import { auth } from "@clerk/nextjs/server";

const ANONYMOUS_SESSION_HEADER = "x-texocad-anonymous-session-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function anonymousSessionIdFromRequest(request: Request) {
  const headerSessionId = request.headers.get(ANONYMOUS_SESSION_HEADER);
  if (headerSessionId && UUID_PATTERN.test(headerSessionId)) {
    return headerSessionId.toLowerCase();
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return null;

  const [scheme, sessionId] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "anonymous" || !sessionId || !UUID_PATTERN.test(sessionId)) {
    return null;
  }

  return sessionId.toLowerCase();
}

export async function resolveRequestOwnerId(request: Request) {
  const { userId } = await auth();
  if (userId) return userId;

  const anonymousSessionId = anonymousSessionIdFromRequest(request);
  return anonymousSessionId ? `anon:${anonymousSessionId}` : null;
}
