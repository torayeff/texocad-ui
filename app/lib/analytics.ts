import posthog from "posthog-js";

export function trackFileDownload(properties: { format: string; partName: string }) {
  posthog.capture("file_downloaded", properties);
}

export function trackMessageSubmitted(properties: {
  hasAttachments: boolean;
}) {
  posthog.capture("message_submitted", properties);
}
