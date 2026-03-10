import React from "react";

import type { ChatMessage as ChatMessageType } from "@/app/components/chat/types";
import { HumanMessage } from "@/app/components/chat/message/HumanMessage";
import { AIMessage } from "@/app/components/chat/message/AIMessage";

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  visibleTodoCallIds,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
  visibleTodoCallIds?: Set<string>;
}) {
  if (message.role === "human") {
    return <HumanMessage message={message} />;
  }

  if (message.role === "ai") {
    return (
      <AIMessage
        message={message}
        isStreaming={isStreaming}
        visibleTodoCallIds={visibleTodoCallIds}
      />
    );
  }

  return null;
});
