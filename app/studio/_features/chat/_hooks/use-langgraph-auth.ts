"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";

import { LANGGRAPH_API_URL } from "@/app/studio/_features/chat/_lib/langgraph-config";

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
    apiUrl: LANGGRAPH_API_URL,
    onRequest: async (_url, init) => {
      const { isSignedIn: signedIn, getToken: requestToken } = authStateRef.current;
      const token = signedIn ? await requestToken() : null;
      if (!token) return init;

      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);

      return { ...init, headers };
    },
  }));

  return { client, isReady: isLoaded };
}
