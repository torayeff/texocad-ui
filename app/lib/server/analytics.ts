import "server-only";

import {
  cleanProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "@/app/lib/analytics/events";

interface CaptureServerEventOptions {
  distinctId?: string;
}

export async function captureServerEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  properties: AnalyticsEventProperties[EventName],
  options: CaptureServerEventOptions = {},
) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) return;

  try {
    await fetch(new URL("/capture/", host), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: token,
        event: eventName,
        distinct_id: options.distinctId ?? "server",
        properties: {
          ...cleanProperties(properties),
          $process_person_profile: Boolean(options.distinctId),
        },
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Failed to capture PostHog server event:", error);
  }
}
