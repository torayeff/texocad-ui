"use client";

import { useMemo } from "react";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

import { useMessageRows } from "@/app/hooks/chat/use-message-rows";
import { getMessageTextContent } from "@/app/lib/chat/message-content";
import { streamRowAccessors } from "@/app/lib/chat/langgraph-stream";
import type { AssistantTimer, TodoItem } from "@/app/types/chat";

interface UseChatMessageViewOptions {
  conversationScope: string;
  defaultAgentName: string;
  isLoading: boolean;
  messages: BaseMessage[];
  pendingHumanMessage: BaseMessage | null;
  stream: unknown;
  timer: AssistantTimer;
  todos: TodoItem[];
}

export function useChatMessageView({
  conversationScope,
  defaultAgentName,
  isLoading,
  messages,
  pendingHumanMessage,
  stream,
  timer,
  todos,
}: UseChatMessageViewOptions) {
  const rowStreamAccessors = useMemo(() => streamRowAccessors(stream), [stream]);

  const lastHumanMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (HumanMessage.isInstance(messages[index])) return messages[index];
    }
    return undefined;
  }, [messages]);

  const shouldRenderPendingHumanMessage = pendingHumanMessage != null && !(
    lastHumanMessage &&
    getMessageTextContent(lastHumanMessage) === getMessageTextContent(pendingHumanMessage)
  );

  const pendingHumanText = useMemo(
    () => pendingHumanMessage ? getMessageTextContent(pendingHumanMessage) : "",
    [pendingHumanMessage],
  );

  const { messageRows } = useMessageRows({
    messages,
    isLoading,
    conversationScope,
    defaultAgentName,
    shouldRenderPendingHumanMessage,
    stream: rowStreamAccessors,
    timer,
  });

  const isEmpty = messageRows.length === 0 && !shouldRenderPendingHumanMessage;
  const lastMessageType = shouldRenderPendingHumanMessage
    ? "human"
    : messageRows[messageRows.length - 1]?.messageType;
  const shouldShowTodoList = todos.length > 0 && lastMessageType !== "human";

  return {
    isEmpty,
    lastMessageType,
    messageRows,
    pendingHumanText,
    shouldRenderPendingHumanMessage,
    shouldShowTodoList,
  };
}
