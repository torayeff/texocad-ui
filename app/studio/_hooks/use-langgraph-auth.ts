"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/app/studio/_lib/langgraph-config";

interface AuthState {
  isSignedIn: boolean | undefined;
  getToken: ReturnType<typeof useAuth>["getToken"];
}

const authState: AuthState = {
  isSignedIn: undefined,
  getToken: () => Promise.resolve(null),
};

const sharedClient = new Client({
  apiUrl: LANGGRAPH_API_URL,
  onRequest: async (_url, init) => {
    const token = authState.isSignedIn
      ? await authState.getToken({ skipCache: true })
      : null;
    if (!token) return init;

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return { ...init, headers };
  },
});

export function useLanggraphAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    authState.isSignedIn = isSignedIn;
    authState.getToken = getToken;
  }, [isSignedIn, getToken]);

  const [client] = useState(sharedClient);

  return { client, isReady: isLoaded };
}
