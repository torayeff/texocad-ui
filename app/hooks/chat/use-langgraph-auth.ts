"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";

import { ANONYMOUS_SESSION_HEADER, LANGGRAPH_API_URL } from "@/app/lib/chat/langgraph-config";

interface LanggraphAuthState {
  isSignedIn: boolean | undefined;
  getToken: ReturnType<typeof useAuth>["getToken"];
  allowAnonymous: boolean;
}

interface UseLanggraphAuthOptions {
  allowAnonymous?: boolean;
}

// Cached across hook instances so a page mints at most one anonymous session.
let anonymousTokenPromise: Promise<string | null> | null = null;

async function fetchAnonymousToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/anonymous-session", { method: "POST" });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: unknown };
    return typeof data.token === "string" && data.token.length > 0 ? data.token : null;
  } catch {
    return null;
  }
}

function ensureAnonymousToken() {
  if (!anonymousTokenPromise) {
    anonymousTokenPromise = fetchAnonymousToken().then((token) => {
      if (!token) {
        anonymousTokenPromise = null;
      }
      return token;
    });
  }
  return anonymousTokenPromise;
}

export function useLanggraphAuth({ allowAnonymous = false }: UseLanggraphAuthOptions = {}) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const authStateRef = useRef<LanggraphAuthState>({ isSignedIn, getToken, allowAnonymous });

  useEffect(() => {
    authStateRef.current = { isSignedIn, getToken, allowAnonymous };
  }, [allowAnonymous, getToken, isSignedIn]);

  // The interceptor reads authStateRef only at request time, never during
  // render, so the ref-in-render lint heuristic is a false positive here.
  // eslint-disable-next-line react-hooks/refs -- ref is read inside the async request interceptor, not during render
  const [client] = useState(() => new Client({
    apiUrl: LANGGRAPH_API_URL,
    onRequest: async (_url, init) => {
      const {
        isSignedIn: signedIn,
        getToken: requestToken,
        allowAnonymous: anonymousAllowed,
      } = authStateRef.current;
      const token = signedIn ? await requestToken() : null;
      if (token) {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return { ...init, headers };
      }

      if (anonymousAllowed) {
        const anonymousToken = await ensureAnonymousToken();
        if (anonymousToken) {
          const headers = new Headers(init.headers);
          headers.set(ANONYMOUS_SESSION_HEADER, anonymousToken);
          return { ...init, headers };
        }
      }

      return init;
    },
  }));

  return { client, isReady: isLoaded };
}
