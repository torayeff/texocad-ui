"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

export function PostHogIdentity() {
  const { isLoaded, user } = useUser();
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      if (identifiedUserIdRef.current) {
        posthog.reset();
        identifiedUserIdRef.current = null;
      }
      return;
    }

    if (identifiedUserIdRef.current === user.id) return;

    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
    });
    identifiedUserIdRef.current = user.id;
  }, [isLoaded, user]);

  return null;
}
