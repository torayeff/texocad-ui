import { SignJWT, jwtVerify } from "jose";

// Contract mirrored from texocad-agents/texocad_agents/auth/identity.py:
// HS256 JWT with payload claims exp/iat/iss/nbf/sub/typ, typ "anonymous_session",
// accepted via this cookie (same-origin) or the header in langgraph-config
// (cross-origin LangGraph API). Owner identity is "anon:<sub>".
export const ANONYMOUS_SESSION_COOKIE = "texocad_anonymous_session";

const ANONYMOUS_SESSION_TYPE = "anonymous_session";
const ANONYMOUS_ID_PREFIX = "anon:";
const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 5;

export const ANONYMOUS_SESSION_MAX_AGE_SECONDS = SESSION_LIFETIME_SECONDS;

export interface AnonymousSession {
  subject: string;
  expiresAtSeconds: number;
}

function sessionIssuer() {
  return process.env.ANONYMOUS_SESSION_ISSUER || "texocad-agents";
}

function sessionSecret(): Uint8Array | null {
  const secret = process.env.ANONYMOUS_SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export function isAnonymousSessionConfigured() {
  return Boolean(process.env.ANONYMOUS_SESSION_SECRET);
}

export async function mintAnonymousSessionToken(subject?: string) {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("ANONYMOUS_SESSION_SECRET is not set");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return new SignJWT({ typ: ANONYMOUS_SESSION_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject ?? crypto.randomUUID())
    .setIssuer(sessionIssuer())
    .setIssuedAt(nowSeconds)
    .setNotBefore(nowSeconds)
    .setExpirationTime(nowSeconds + SESSION_LIFETIME_SECONDS)
    .sign(secret);
}

export async function verifyAnonymousSessionToken(token: string): Promise<AnonymousSession | null> {
  const secret = sessionSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: sessionIssuer(),
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      requiredClaims: ["exp", "iat", "nbf", "sub"],
    });

    if (payload.typ !== ANONYMOUS_SESSION_TYPE) return null;
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    if (typeof payload.exp !== "number") return null;

    return { subject: payload.sub, expiresAtSeconds: payload.exp };
  } catch {
    return null;
  }
}

export function anonymousOwnerId(subject: string) {
  if (subject.startsWith(ANONYMOUS_ID_PREFIX)) return subject;
  return `${ANONYMOUS_ID_PREFIX}${subject}`;
}

export function shouldRefreshAnonymousSession(session: AnonymousSession) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return session.expiresAtSeconds - nowSeconds < REFRESH_THRESHOLD_SECONDS;
}

export async function anonymousOwnerFromToken(token: string | null | undefined) {
  if (!token) return null;
  const session = await verifyAnonymousSessionToken(token);
  if (!session) return null;
  return anonymousOwnerId(session.subject);
}
