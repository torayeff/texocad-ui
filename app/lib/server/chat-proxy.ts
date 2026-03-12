import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8000";

function copyHeaderIfPresent(
  source: Headers,
  target: Headers,
  name: string,
) {
  const value = source.get(name);
  if (value) {
    target.set(name, value);
  }
}

export async function createBackendHeaders(
  init?: HeadersInit,
): Promise<Headers | Response> {
  const { userId, getToken } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Missing Clerk session token" }, { status: 401 });
  }

  const headers = new Headers(init);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function proxyBackendJson(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = await createBackendHeaders(init.headers);
  if (headers instanceof Response) {
    return headers;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = await response.text();
  const responseHeaders = new Headers();
  copyHeaderIfPresent(response.headers, responseHeaders, "content-type");

  return new Response(body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function proxyBackendStream(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = await createBackendHeaders(init.headers);
  if (headers instanceof Response) {
    return headers;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  copyHeaderIfPresent(response.headers, responseHeaders, "content-type");
  copyHeaderIfPresent(response.headers, responseHeaders, "cache-control");
  copyHeaderIfPresent(response.headers, responseHeaders, "x-accel-buffering");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
