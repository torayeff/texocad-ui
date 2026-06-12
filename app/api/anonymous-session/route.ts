import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getOrCreateAnonymousSession,
  setAnonymousSessionCookie,
} from "@/app/lib/server/anonymous-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getOrCreateAnonymousSession>>;
  try {
    session = await getOrCreateAnonymousSession(request);
  } catch (error) {
    console.error("Anonymous session is not configured:", error);
    return NextResponse.json({ error: "Anonymous sessions are not configured." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });

  if (session.shouldSetCookie) {
    setAnonymousSessionCookie(response, session.token);
  }

  return response;
}
