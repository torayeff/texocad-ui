"use client";

import posthog from "posthog-js";
import type { Properties } from "posthog-js";

import {
  cleanProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "@/app/lib/analytics/events";

export function trackEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  properties: AnalyticsEventProperties[EventName],
) {
  posthog.capture(eventName, cleanProperties(properties) as Properties);
}
