import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getOrCreateAnonymousSession,
  setAnonymousSessionCookie,
} from "@/app/lib/server/anonymous-session";
import { captureServerEvent } from "@/app/lib/server/analytics";
import { durationBucket, errorKind } from "@/app/lib/analytics/events";

export const runtime = "nodejs";

interface LangGraphProxyContext {
  params: Promise<{
    path?: string[];
  }>;
}

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-encoding",
  "content-length",
  "cookie",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function langGraphUpstreamUrl(path: string[], search: string) {
  const baseUrl = process.env.LANGGRAPH_API_URL ?? process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  if (!baseUrl) {
    throw new Error("LANGGRAPH_API_URL or NEXT_PUBLIC_LANGGRAPH_API_URL is not set.");
  }

  const url = new URL(path.join("/"), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.search = search;
  return url;
}

function requestHeadersForUpstream(request: NextRequest) {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

function responseHeadersFromUpstream(response: Response) {
  const headers = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

async function proxyLangGraphRequest(request: NextRequest, context: LangGraphProxyContext) {
  const startedAt = performance.now();
  const { path = [] } = await context.params;
  const distinctId = request.headers.get("x-posthog-distinct-id") ?? undefined;
  let upstreamUrl: URL;
  try {
    upstreamUrl = langGraphUpstreamUrl(path, request.nextUrl.search);
  } catch (error) {
    console.error("LangGraph proxy is not configured:", error);
    await captureServerEvent("api_langgraph_proxy", {
      duration_bucket: durationBucket(performance.now() - startedAt),
      error_kind: errorKind(error),
      method: request.method,
      path_depth: path.length,
      status: 500,
      success: false,
    }, { distinctId });
    return NextResponse.json({ error: "LangGraph proxy is not configured." }, { status: 500 });
  }

  const headers = requestHeadersForUpstream(request);
  let anonymousSession: Awaited<ReturnType<typeof getOrCreateAnonymousSession>> | null = null;
  try {
    anonymousSession = headers.has("Authorization")
      ? null
      : await getOrCreateAnonymousSession(request);
  } catch (error) {
    console.error("Anonymous session is not configured:", error);
    await captureServerEvent("api_langgraph_proxy", {
      duration_bucket: durationBucket(performance.now() - startedAt),
      error_kind: errorKind(error),
      method: request.method,
      path_depth: path.length,
      status: 500,
      success: false,
    }, { distinctId });
    return NextResponse.json({ error: "Anonymous sessions are not configured." }, { status: 500 });
  }

  if (anonymousSession) {
    headers.set("Authorization", `Anonymous ${anonymousSession.token}`);
  }

  const hasRequestBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    body: hasRequestBody ? request.body : undefined,
    cache: "no-store",
    duplex: hasRequestBody ? "half" : undefined,
    headers,
    method: request.method,
    redirect: "manual",
  };

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, init);
  } catch (error) {
    await captureServerEvent("api_langgraph_proxy", {
      duration_bucket: durationBucket(performance.now() - startedAt),
      error_kind: errorKind(error),
      method: request.method,
      path_depth: path.length,
      status: 502,
      success: false,
    }, { distinctId });
    throw error;
  }
  const response = new Response(upstreamResponse.body, {
    headers: responseHeadersFromUpstream(upstreamResponse),
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  if (anonymousSession?.shouldSetCookie) {
    setAnonymousSessionCookie(response, anonymousSession.token);
  }

  await captureServerEvent("api_langgraph_proxy", {
    duration_bucket: durationBucket(performance.now() - startedAt),
    method: request.method,
    path_depth: path.length,
    status: upstreamResponse.status,
    success: upstreamResponse.ok,
  }, { distinctId });

  return response;
}

export function GET(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function HEAD(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function POST(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function PUT(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function PATCH(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function DELETE(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}

export function OPTIONS(request: NextRequest, context: LangGraphProxyContext) {
  return proxyLangGraphRequest(request, context);
}
