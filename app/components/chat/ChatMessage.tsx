"use client";

import React from "react";

import type { ChatMessage as ChatMessageType } from "./types";
import { MessageBubble, ThinkingBlock, ToolCallCard, TodoCard, AITextContent } from "./MessageFormatters";

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
    return <MessageBubble message={message} />;
  }

  if (message.role === "ai") {
    const hasToolCalls = message.toolCalls.length > 0;
    const hasText = message.content.trim().length > 0;

    if (!hasToolCalls && !hasText && !isStreaming) return null;

    const isThinking = isStreaming && !hasToolCalls && !hasText;

    return (
      <div className="w-full space-y-2">
        <ThinkingBlock message={message} isStreaming={isThinking} />
        {hasToolCalls && (
          <div className="flex flex-col gap-1.5">
            {message.toolCalls.map((tc) => {
              if (tc.name === "write_todos") {
                if (!visibleTodoCallIds?.has(tc.id)) return null;
                return <TodoCard key={tc.id} toolCall={tc} />;
              }
              return <ToolCallCard key={tc.id} toolCall={tc} />;
            })}
          </div>
        )}
        <AITextContent message={message} />
      </div>
    );
  }

  return null;
});
