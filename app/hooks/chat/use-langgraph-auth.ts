"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";

import { LANGGRAPH_API_URL } from "@/app/lib/chat/langgraph-config";

interface LanggraphAuthState {
  isSignedIn: boolean | undefined;
  getToken: ReturnType<typeof useAuth>["getToken"];
}

const ANONYMOUS_SESSION_STORAGE_KEY = "texocad-anonymous-session-id";

let cachedAnonymousSessionId: string | null = null;

function anonymousSessionId(): string {
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

export function useLanggraphAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const authStateRef = useRef<LanggraphAuthState>({ isSignedIn, getToken });

  useEffect(() => {
    authStateRef.current = { isSignedIn, getToken };
  }, [getToken, isSignedIn]);

  // The interceptor reads authStateRef only at request time, never during
  // render, so the ref-in-render lint heuristic is a false positive here.
  // eslint-disable-next-line react-hooks/refs -- ref is read inside the async request interceptor, not during render
  const [client] = useState(() => new Client({
    apiUrl: LANGGRAPH_API_URL,
    onRequest: async (_url, init) => {
      const { isSignedIn: signedIn, getToken: requestToken } = authStateRef.current;
      const token = signedIn ? await requestToken() : null;
      if (token) {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return { ...init, headers };
      }

      if (signedIn === false) {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Anonymous ${anonymousSessionId()}`);
        return { ...init, headers };
      }

      return init;
    },
  }));

  return { client, isReady: isLoaded };
}
