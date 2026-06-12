"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";

import { ensureAnonymousSession } from "@/app/lib/chat/anonymous-session";
import { LANGGRAPH_API_URL } from "@/app/lib/chat/langgraph-config";

interface LanggraphAuthState {
  isSignedIn: boolean | undefined;
  getToken: ReturnType<typeof useAuth>["getToken"];
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
    apiUrl: typeof window === "undefined"
      ? LANGGRAPH_API_URL
      : new URL(LANGGRAPH_API_URL, window.location.origin).toString(),
    onRequest: async (_url, init) => {
      const { isSignedIn: signedIn, getToken: requestToken } = authStateRef.current;
      const token = signedIn ? await requestToken() : null;
      if (token) {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return { ...init, headers };
      }

      if (signedIn === false) {
        await ensureAnonymousSession();
        return { ...init, credentials: "same-origin" };
      }

      return init;
    },
  }));

  return { client, isReady: isLoaded };
}
