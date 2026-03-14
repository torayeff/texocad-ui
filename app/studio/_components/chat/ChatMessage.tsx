import React from "react";
import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { AIPanel, ActivitySection } from "@/app/studio/_components/chat/AIPanel";
import { ToolCallCard, type StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_lib/message-content";

interface ChatMessageProps {
  message: BaseMessage;
  isStreaming?: boolean;
  toolCalls?: StreamToolCall[];
  forcePanelShell?: boolean;
}

export function HumanMessageBubble({ message }: { message: BaseMessage }) {
  const text = getMessageTextContent(message);

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

function AIMessageView({
  message,
  isStreaming,
  toolCalls,
  forcePanelShell,
}: {
  message: AIMessage;
  isStreaming: boolean;
  toolCalls: StreamToolCall[];
  forcePanelShell: boolean;
}) {
  const text = getMessageTextContent(message);
  const thinking = getReasoningContent(message);

  const hasText = text.trim().length > 0;
  const hasToolCalls = toolCalls.length > 0;
  const hasActivity = hasToolCalls;

  const activityParts: string[] = [];
  if (hasToolCalls) {
    activityParts.push(`${toolCalls.length} tool${toolCalls.length === 1 ? "" : "s"}`);
  }

  let statusLabel: string | null = null;
  if (thinking && isStreaming) statusLabel = "Thinking";
  else if (isStreaming) statusLabel = "Working";

  const agentName = message.name ?? "";
  const usage = message.usage_metadata;

  if (!hasText && !hasActivity && !isStreaming && !forcePanelShell) return null;

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      usage={usage ? {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        reasoningTokens: usage.output_token_details?.reasoning,
      } : undefined}
    >
      {hasText ? <InlineTextContent content={text} /> : null}

      {thinking ? (
        <InlineThinkingBlock
          content={thinking}
          isStreaming={isStreaming && !hasText}
          defaultOpen={false}
        />
      ) : null}

      {hasActivity ? (
        <ActivitySection summary={activityParts.join(" · ")}>
          {toolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id}
              toolCall={tc}
            />
          ))}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  toolCalls = [],
  forcePanelShell = false,
}: ChatMessageProps) {
  if (HumanMessage.isInstance(message)) {
    return <HumanMessageBubble message={message} />;
  }

  if (AIMessage.isInstance(message)) {
    return (
      <AIMessageView
        message={message}
        isStreaming={isStreaming}
        toolCalls={toolCalls}
        forcePanelShell={forcePanelShell}
      />
    );
  }

  return null;
});
