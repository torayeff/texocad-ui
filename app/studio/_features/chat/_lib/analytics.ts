import posthog from "posthog-js";

export function trackMessageSubmitted(properties: {
  hasAttachments: boolean;
}) {
  posthog.capture("message_submitted", properties);
}
