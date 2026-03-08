"use client";

import React from "react";
import type { DefaultToolCall, ToolCallWithResult } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

import { MessageBubble, ThinkingBlock, ToolCallCard, TodoCard, AITextContent } from "./MessageFormatters";
import { getMessageTextContent } from "./message-content";

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  toolCalls,
  visibleTodoCallIds,
}: {
  message: Message;
  isStreaming?: boolean;
  toolCalls?: ToolCallWithResult<DefaultToolCall>[];
  visibleTodoCallIds?: Set<string>;
}) {
  if (message.type === "human") {
    return <MessageBubble message={message} />;
  }

  if (message.type === "ai") {
    const hasToolCalls = toolCalls && toolCalls.length > 0;
    const textContent = getMessageTextContent(message.content);
    const hasText = textContent.trim().length > 0;

    if (!hasToolCalls && !hasText && !isStreaming) return null;

    const isThinking = isStreaming && !hasToolCalls && !hasText;

    return (
      <div className="w-full space-y-2">
        <ThinkingBlock message={message} isStreaming={isThinking} />
        {hasToolCalls && (
          <div className="flex flex-col gap-1.5">
            {toolCalls.map((tc) => {
              if (tc.call.name === "write_todos") {
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
