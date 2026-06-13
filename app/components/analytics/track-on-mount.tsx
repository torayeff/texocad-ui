"use client";

import { useEffect } from "react";

import { trackEvent } from "@/app/lib/analytics/client";
import type {
  AnalyticsEventName,
  AnalyticsEventProperties,
} from "@/app/lib/analytics/events";

interface TrackOnMountProps<EventName extends AnalyticsEventName> {
  eventName: EventName;
  properties: AnalyticsEventProperties[EventName];
}

export function TrackOnMount<EventName extends AnalyticsEventName>({
  eventName,
  properties,
}: TrackOnMountProps<EventName>) {
  useEffect(() => {
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}
