"use client";

import { useCallback } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { trackEvent } from "@/app/lib/analytics/client";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

type LockedAgentAction = "sign-in" | "upgrade";

interface UseAgentAccessGateOptions {
  gate: string;
  location: string;
  onAfterAction?: () => void;
}

export function useAgentAccessGate({
  gate,
  location,
  onAfterAction,
}: UseAgentAccessGateOptions) {
  const { has, isLoaded, isSignedIn, sessionClaims } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const hasAgentAccess = Boolean(
    isSignedIn
    && (
      has?.({ plan: CLERK_PLAN_SLUG })
      || sessionClaims?.freeAccess === true
      || sessionClaims?.vipAccess === true
    ),
  );
  const lockedAgentAction: LockedAgentAction | null = !isLoaded || hasAgentAccess
    ? null
    : (isSignedIn ? "upgrade" : "sign-in");
  const shouldLockRestrictedAgents = !isLoaded || lockedAgentAction !== null;
  const lockedAgentTooltip = !isLoaded
    ? "Checking access..."
    : lockedAgentAction === "upgrade"
      ? "Upgrade to unlock"
      : "Sign in to unlock";

  const handleLockedAgentSelect = useCallback(() => {
    if (!isLoaded) return;

    if (lockedAgentAction === "upgrade") {
      trackEvent("auth_gate_clicked", {
        action: "upgrade",
        gate,
        is_signed_in: Boolean(isSignedIn),
      });
      trackEvent("upgrade_clicked", {
        gate,
        location,
      });
      router.push(SITE_ROUTES.pricing);
      onAfterAction?.();
      return;
    }

    trackEvent("auth_gate_clicked", {
      action: "sign-in",
      gate,
      is_signed_in: Boolean(isSignedIn),
    });
    trackEvent("sign_in_opened", {
      gate,
      location,
    });
    openSignIn();
    onAfterAction?.();
  }, [gate, isLoaded, isSignedIn, location, lockedAgentAction, onAfterAction, openSignIn, router]);

  return {
    handleLockedAgentSelect,
    lockedAgentTooltip,
    shouldLockRestrictedAgents,
  };
}
