import { randomUUID } from "node:crypto";
import type { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const ANONYMOUS_SESSION_COOKIE = "texocad-anonymous-session";
const ANONYMOUS_SESSION_ISSUER = process.env.ANONYMOUS_SESSION_ISSUER ?? "texocad-ui";
const ANONYMOUS_SESSION_AUDIENCE = process.env.ANONYMOUS_SESSION_AUDIENCE ?? "texocad-agents";
const ANONYMOUS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ANONYMOUS_SUBJECT_PREFIX = "anon:";
const JWT_ALGORITHM = "HS256";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AnonymousSession {
  ownerId: string;
  token: string;
}

function anonymousSessionSecret() {
  const secret = process.env.ANONYMOUS_SESSION_SECRET;
  if (!secret) {
    throw new Error("ANONYMOUS_SESSION_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
}

function isValidAnonymousSubject(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith(ANONYMOUS_SUBJECT_PREFIX)) {
    return false;
  }
  return UUID_PATTERN.test(value.slice(ANONYMOUS_SUBJECT_PREFIX.length));
}

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
}

async function createAnonymousSessionToken() {
  const sessionId = randomUUID();
  const ownerId = `${ANONYMOUS_SUBJECT_PREFIX}${sessionId}`;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setAudience(ANONYMOUS_SESSION_AUDIENCE)
    .setExpirationTime(`${ANONYMOUS_SESSION_MAX_AGE_SECONDS}s`)
    .setIssuedAt()
    .setIssuer(ANONYMOUS_SESSION_ISSUER)
    .setJti(randomUUID())
    .setNotBefore("0s")
    .setSubject(ownerId)
    .sign(anonymousSessionSecret());

  return {
    ownerId,
    token,
  };
}

async function verifyAnonymousSessionToken(token: string): Promise<AnonymousSession | null> {
  try {
    const { payload } = await jwtVerify(token, anonymousSessionSecret(), {
      algorithms: [JWT_ALGORITHM],
      audience: ANONYMOUS_SESSION_AUDIENCE,
      issuer: ANONYMOUS_SESSION_ISSUER,
      typ: "JWT",
    });

    if (!isValidAnonymousSubject(payload.sub)) {
      return null;
    }

    return {
      ownerId: payload.sub,
      token,
    };
  } catch {
    return null;
  }
}

export async function anonymousSessionFromRequest(request: Request): Promise<AnonymousSession | null> {
  const token = cookieValue(request, ANONYMOUS_SESSION_COOKIE);
  return token ? verifyAnonymousSessionToken(token) : null;
}

export async function getOrCreateAnonymousSession(request: Request) {
  const existingSession = await anonymousSessionFromRequest(request);
  if (existingSession) {
    return {
      ...existingSession,
      shouldSetCookie: false,
    };
  }

  return {
    ...await createAnonymousSessionToken(),
    shouldSetCookie: true,
  };
}

export function setAnonymousSessionCookie(response: NextResponse | Response, token: string) {
  if ("cookies" in response) {
    response.cookies.set(ANONYMOUS_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: ANONYMOUS_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return;
  }

  response.headers.append(
    "Set-Cookie",
    [
      `${ANONYMOUS_SESSION_COOKIE}=${encodeURIComponent(token)}`,
      "HttpOnly",
      `Max-Age=${ANONYMOUS_SESSION_MAX_AGE_SECONDS}`,
      "Path=/",
      "SameSite=Lax",
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; "),
  );
}
