"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/app/studio/_lib/langgraph-config";

export function useLanggraphAuth() {
  const { getToken, isSignedIn } = useAuth();

  const client = useMemo(
    () =>
      new Client({
        apiUrl: LANGGRAPH_API_URL,
        onRequest: async (_url, init) => {
          const token = isSignedIn ? await getToken({ skipCache: true }) : null;
          if (!token) return init;

          const headers = new Headers(init.headers);
          headers.set("Authorization", `Bearer ${token}`);

          return {
            ...init,
            headers,
          };
        },
      }),
    [getToken, isSignedIn],
  );

  const isReady = isSignedIn === true;

  return { client, isReady };
}
