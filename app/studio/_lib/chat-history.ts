import type {
  ChatMessage,
  HydratedHistory,
  NormalizedHistoryEvent,
} from "@/app/studio/_types/chat";

import {
  createHumanMessage,
  createEmptyAiMessage,
  applyThinkingChunk,
  applyTextChunk,
  applyToolCall,
  applyToolResult,
  applyUsagePayload,
  applyErrorPayload,
} from "@/app/studio/_lib/chat-messages";

const HISTORY_EVENT_META_KEYS = new Set([
  "id",
  "thread_id",
  "run_id",
  "created_at",
  "updated_at",
]);

export function hydrateHistory(rawEvents: unknown): HydratedHistory {
  if (!Array.isArray(rawEvents)) {
    return { messages: [], customEvents: [] };
  }

  const events = rawEvents
    .map(normalizeHistoryEvent)
    .filter((event): event is NormalizedHistoryEvent => event !== null);

  const messages: ChatMessage[] = [];
  const customEvents: Record<string, unknown>[] = [];
  let currentAiMessage: ChatMessage | null = null;

  const flushAiMessage = () => {
    if (!currentAiMessage) return;
    if (
      !currentAiMessage.content &&
      !currentAiMessage.thinking &&
      currentAiMessage.toolCalls.length === 0 &&
      currentAiMessage.blocks.length === 0
    ) {
      currentAiMessage = null;
      return;
    }

    messages.push(currentAiMessage);
    currentAiMessage = null;
  };

  const ensureAiMessage = () => {
    if (currentAiMessage) return currentAiMessage;

    currentAiMessage = createEmptyAiMessage();
    return currentAiMessage;
  };

  for (const event of events) {
    const { name, payload } = event;
    const agent = getStringValue(payload.agent);
    const isSubagent = Boolean(payload.subagent ?? payload.is_subagent);

    switch (name) {
      case "user_message": {
        flushAiMessage();
        messages.push(createHumanMessage(stringifyContent(payload.content)));
        break;
      }
      case "thinking": {
        const chunk = stringifyContent(payload.content);
        if (!chunk) break;
        currentAiMessage = applyThinkingChunk(
          ensureAiMessage(),
          chunk,
          agent,
          isSubagent,
        );
        break;
      }
      case "text": {
        const chunk = stringifyContent(payload.content);
        if (!chunk) break;
        currentAiMessage = applyTextChunk(
          ensureAiMessage(),
          chunk,
          agent,
          isSubagent,
        );
        break;
      }
      case "tool_call": {
        currentAiMessage = applyToolCall(
          ensureAiMessage(),
          getStringValue(payload.name) || "tool",
          getRecordValue(payload.args) ?? {},
          agent,
          isSubagent,
        );
        break;
      }
      case "tool_result": {
        currentAiMessage = applyToolResult(
          ensureAiMessage(),
          getStringValue(payload.name),
          stringifyContent(payload.content),
          agent,
          isSubagent,
        );
        break;
      }
      case "usage": {
        currentAiMessage = applyUsagePayload(ensureAiMessage(), payload);
        break;
      }
      case "error": {
        currentAiMessage = applyErrorPayload(
          ensureAiMessage(),
          getStringValue(payload.message) || stringifyContent(payload.content),
          agent,
          isSubagent,
        );
        break;
      }
      case "done": {
        flushAiMessage();
        break;
      }
      default: {
        customEvents.push(
          "type" in payload
            ? payload
            : {
              ...payload,
              type: name,
            },
        );
        break;
      }
    }
  }

  flushAiMessage();
  return { messages, customEvents };
}

function normalizeHistoryEvent(
  rawEvent: unknown,
): NormalizedHistoryEvent | null {
  const event = getRecordValue(rawEvent);
  if (!event) return null;

  const name =
    getStringValue(event.event_name) ||
    getStringValue(event.event) ||
    getStringValue(event.type);
  if (!name) return null;

  const payload =
    getRecordValue(event.payload) ??
    getRecordValue(event.data) ??
    Object.fromEntries(
      Object.entries(event).filter(
        ([key]) =>
          !HISTORY_EVENT_META_KEYS.has(key) &&
          key !== "event" &&
          key !== "event_name" &&
          key !== "type" &&
          key !== "payload" &&
          key !== "data",
      ),
    );

  return {
    name,
    payload,
  };
}

function getRecordValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
