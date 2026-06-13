import { trackEvent } from "@/app/lib/analytics/client";

export function trackMessageSubmitted(properties: {
  agentId: string;
  attachmentCount: number;
  hasAttachments: boolean;
  isVip: boolean;
  messageLength: number;
  model?: string;
  newThread: boolean;
  reasoningEffort: string;
  submissionSource: "composer" | "mask_editor" | "programmatic";
  threadIdPresent: boolean;
}) {
  trackEvent("message_submitted", {
    agent_id: properties.agentId,
    attachment_count: properties.attachmentCount,
    has_attachments: properties.hasAttachments,
    is_vip: properties.isVip,
    message_length: properties.messageLength,
    model: properties.model,
    new_thread: properties.newThread,
    reasoning_effort: properties.reasoningEffort,
    submission_source: properties.submissionSource,
    thread_id_present: properties.threadIdPresent,
  });
}
