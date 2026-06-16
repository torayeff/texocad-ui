"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";

import { LANGGRAPH_DIRECT_API_URL } from "@/app/lib/chat/langgraph-config";

export function useLanggraphAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const apiUrl = LANGGRAPH_DIRECT_API_URL ?? "";

  const client = useMemo(() => new Client({
    apiUrl: typeof window === "undefined"
      ? apiUrl
      : new URL(apiUrl, window.location.origin).toString(),
    onRequest: async (_url, init) => {
      const token = isSignedIn ? await getToken() : null;
      if (token) {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return { ...init, headers };
      }

      return init;
    },
  }), [apiUrl, getToken, isSignedIn]);

  return { client, isReady: isLoaded };
}
