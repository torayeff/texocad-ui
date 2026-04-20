import { useMemo, useRef, useEffect } from "react";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { ClassSubagentStreamInterface } from "@langchain/react";

import { getMessageTextContent, getReasoningContent } from "@/app/studio/_lib/message-content";
import {
  EMPTY_SUBAGENTS,
  EMPTY_TOOL_CALLS,
  getMessageRowKey,
  getMessageUsage,
  getSubagentsSignature,
  getToolCallsSignature,
} from "@/app/studio/_lib/message-rows";
import type { MessageRow } from "@/app/studio/_lib/message-rows";
import type { StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";
import type { useAssistantTimer } from "@/app/studio/_hooks/use-assistant-timer";

export interface StreamAccessors {
  getToolCalls?: (message: BaseMessage) => StreamToolCall[];
  getSubagentsByMessage?: (messageId: string) => ClassSubagentStreamInterface[];
  subagents?: Map<string, ClassSubagentStreamInterface>;
}

export function useMessageRows({
  messages,
  isLoading,
  conversationScope,
  shouldRenderPendingHumanMessage,
  streamAccessors,
  timer,
}: {
  messages: BaseMessage[];
  isLoading: boolean;
  conversationScope: string;
  shouldRenderPendingHumanMessage: boolean;
  streamAccessors: StreamAccessors;
  timer: ReturnType<typeof useAssistantTimer>;
}): { messageRows: MessageRow[]; activeAssistantRowKey: string | null } {
  const prevActiveRowKeyRef = useRef<string | null>(null);
  const prevIsLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoading && !prevIsLoadingRef.current) {
      timer.reset();
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, timer]);

  const messageRows = useMemo(() => {
    const accessors = streamAccessors;

    let lastHumanIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (HumanMessage.isInstance(messages[index])) {
        lastHumanIndex = index;
        break;
      }
    }

    let activeAssistantIndex = -1;
    if (isLoading && !shouldRenderPendingHumanMessage) {
      for (let index = messages.length - 1; index > lastHumanIndex; index -= 1) {
        if (AIMessage.isInstance(messages[index])) {
          activeAssistantIndex = index;
          break;
        }
      }
    }

    const rows: MessageRow[] = [];

    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];

      if (HumanMessage.isInstance(message)) {
        const rowKey = getMessageRowKey(rows.length, conversationScope, message.id);
        rows.push({
          rowKey,
          messageType: "human",
          textContent: getMessageTextContent(message),
          thinkingContent: "",
          isStreaming: false,
          startedAtMs: undefined,
          toolCalls: EMPTY_TOOL_CALLS,
          toolCallsSignature: "",
          subagents: EMPTY_SUBAGENTS,
          subagentsSignature: "",
          renderMarkdown: true,
        });
        continue;
      }

      if (!AIMessage.isInstance(message)) {
        continue;
      }

      const rowKey = getMessageRowKey(rows.length, conversationScope, message.id);
      const isActive = index === activeAssistantIndex;

      if (isActive) {
        timer.markStart(rowKey);
      }

      const textContent = getMessageTextContent(message);
      const thinkingContent = getReasoningContent(message);
      const runtimeSeconds = timer.runtimeSecondsByRow[rowKey];
      let toolCalls = EMPTY_TOOL_CALLS;

      if (accessors.getToolCalls) {
        const nextToolCalls = accessors.getToolCalls(message);
        if (nextToolCalls.length > 0) toolCalls = nextToolCalls;
      }

      let subagents = EMPTY_SUBAGENTS;
      if (message.id && accessors.getSubagentsByMessage) {
        const nextSubagents = accessors.getSubagentsByMessage(message.id);
        if (nextSubagents.length > 0) subagents = nextSubagents;
      }

      if (subagents === EMPTY_SUBAGENTS && accessors.subagents instanceof Map && accessors.subagents.size > 0) {
        const taskCallIds = new Set(
          toolCalls
            .filter((toolCall) => toolCall.call.name === "task")
            .map((toolCall) => toolCall.call.id ?? toolCall.id),
        );
        if (taskCallIds.size > 0) {
          const matchingSubagents = [...accessors.subagents.values()].filter(
            (subagent) => taskCallIds.has(subagent.id),
          );
          if (matchingSubagents.length > 0) subagents = matchingSubagents;
        }
      }

      rows.push({
        rowKey,
        messageType: "ai",
        textContent,
        thinkingContent,
        agentName: message.name ?? "",
        usage: getMessageUsage(message, runtimeSeconds),
        isStreaming: isActive,
        startedAtMs: isActive ? timer.getStartedAtMs(rowKey) : undefined,
        toolCalls,
        toolCallsSignature: toolCalls === EMPTY_TOOL_CALLS ? "" : getToolCallsSignature(toolCalls),
        subagents,
        subagentsSignature: subagents === EMPTY_SUBAGENTS ? "" : getSubagentsSignature(subagents),
        renderMarkdown: true,
      });
    }

    return rows;
    // timer.markStart/getStartedAtMs are ref-based and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversationScope,
    isLoading,
    messages,
    shouldRenderPendingHumanMessage,
    streamAccessors,
    timer.runtimeSecondsByRow,
  ]);

  const activeAssistantRowKey = useMemo(() => {
    for (let index = messageRows.length - 1; index >= 0; index -= 1) {
      const row = messageRows[index];
      if (row.messageType === "ai" && row.isStreaming) return row.rowKey;
    }
    return null;
  }, [messageRows]);

  useEffect(() => {
    const prev = prevActiveRowKeyRef.current;
    if (prev && prev !== activeAssistantRowKey) {
      timer.finalize(prev);
    }
    prevActiveRowKeyRef.current = activeAssistantRowKey;
  }, [activeAssistantRowKey, timer]);

  return { messageRows, activeAssistantRowKey };
}
