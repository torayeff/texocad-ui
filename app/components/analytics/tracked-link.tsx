"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackEvent } from "@/app/lib/analytics/client";
import type { AnalyticsEventProperties } from "@/app/lib/analytics/events";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  analytics: AnalyticsEventProperties["cta_clicked"];
};

type TrackedAnchorProps = ComponentProps<"a"> & {
  analytics: AnalyticsEventProperties["cta_clicked"];
};

export function TrackedLink({ analytics, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent("cta_clicked", analytics);
        onClick?.(event);
      }}
    />
  );
}

export function TrackedAnchor({ analytics, onClick, ...props }: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackEvent("cta_clicked", analytics);
        onClick?.(event);
      }}
    />
  );
}
