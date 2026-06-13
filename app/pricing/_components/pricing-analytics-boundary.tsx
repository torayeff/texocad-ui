"use client";

import { useRef, type ReactNode } from "react";

import { trackEvent } from "@/app/lib/analytics/client";
import type { AnalyticsEventProperties } from "@/app/lib/analytics/events";

interface PricingAnalyticsBoundaryProps {
  accessState: AnalyticsEventProperties["pricing_viewed"]["access_state"];
  children: ReactNode;
}

export function PricingAnalyticsBoundary({
  accessState,
  children,
}: PricingAnalyticsBoundaryProps) {
  const hasTrackedCheckoutIntentRef = useRef(false);

  return (
    <div
      onClickCapture={() => {
        if (hasTrackedCheckoutIntentRef.current) return;
        hasTrackedCheckoutIntentRef.current = true;
        trackEvent("checkout_started", {
          access_state: accessState,
          location: "pricing_table",
        });
      }}
    >
      {children}
    </div>
  );
}
