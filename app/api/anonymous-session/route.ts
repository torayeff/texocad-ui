import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE,
  ANONYMOUS_SESSION_MAX_AGE_SECONDS,
  isAnonymousSessionConfigured,
  mintAnonymousSessionToken,
  shouldRefreshAnonymousSession,
  verifyAnonymousSessionToken,
} from "@/app/lib/server/anonymous-session";

export async function POST(request: NextRequest) {
  if (!isAnonymousSessionConfigured()) {
    return NextResponse.json({ error: "Anonymous sessions not configured" }, { status: 500 });
  }

  const existingToken = request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value ?? null;
  const existingSession = existingToken
    ? await verifyAnonymousSessionToken(existingToken)
    : null;

  // Reuse a valid session so the anonymous identity (and its designs) stays
  // stable across visits; re-mint near expiry to keep long-lived visitors working.
  if (existingToken && existingSession && !shouldRefreshAnonymousSession(existingSession)) {
    return NextResponse.json({ token: existingToken });
  }

  let token: string;
  try {
    token = await mintAnonymousSessionToken(existingSession?.subject);
  } catch (err) {
    console.error("Failed to mint anonymous session token:", err);
    return NextResponse.json({ error: "Failed to create anonymous session" }, { status: 500 });
  }

  const response = NextResponse.json({ token });
  response.cookies.set({
    name: ANONYMOUS_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANONYMOUS_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
