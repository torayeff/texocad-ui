import React from "react";
import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { AIPanel, ActivitySection } from "@/app/studio/_components/chat/AIPanel";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";

interface ChatMessageProps {
  message: BaseMessage;
  isStreaming?: boolean;
}

function getTextContent(msg: BaseMessage): string {
  if (typeof msg.content === "string") return msg.content;
  if (!Array.isArray(msg.content)) return "";
  return msg.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function getReasoningContent(msg: BaseMessage): string | undefined {
  if ("contentBlocks" in msg && Array.isArray(msg.contentBlocks)) {
    const reasoning = msg.contentBlocks
      .filter((b): b is { type: "reasoning"; reasoning: string } =>
        b.type === "reasoning" && typeof (b as Record<string, unknown>).reasoning === "string"
      )
      .map((b) => b.reasoning)
      .join("");
    if (reasoning.trim()) return reasoning;
  }
  const raw = msg.additional_kwargs?.reasoning_content
    ?? msg.additional_kwargs?.thinking;
  if (typeof raw === "string") return raw;
  return undefined;
}

export function HumanMessageBubble({ message }: { message: BaseMessage }) {
  const text = getTextContent(message);

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
}: {
  message: AIMessage;
  isStreaming: boolean;
}) {
  const text = getTextContent(message);
  const thinking = getReasoningContent(message);
  const toolCalls = message.tool_calls ?? [];

  const visibleToolCalls = toolCalls.filter(
    (tc) => tc.name !== "task" && tc.name !== "write_todos",
  );

  const hasText = text.trim().length > 0;
  const hasThinking = !!thinking;
  const hasToolCalls = visibleToolCalls.length > 0;
  const hasActivity = hasThinking || hasToolCalls;

  const activityParts: string[] = [];
  if (hasThinking) activityParts.push("1 thought");
  if (hasToolCalls) {
    activityParts.push(`${visibleToolCalls.length} tool${visibleToolCalls.length === 1 ? "" : "s"}`);
  }

  let statusLabel: string | null = null;
  if (thinking && isStreaming) statusLabel = "Thinking";
  else if (isStreaming) statusLabel = "Working";

  const agentName = message.name ?? "";
  const usage = message.usage_metadata;

  if (!hasText && !hasActivity && !isStreaming) return null;

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      usage={usage ? {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      } : undefined}
    >
      {hasText ? <InlineTextContent content={text} /> : null}

      {hasActivity ? (
        <ActivitySection summary={activityParts.join(" · ")}>
          {thinking ? (
            <InlineThinkingBlock
              content={thinking}
              isStreaming={isStreaming && !hasText}
              defaultOpen={false}
            />
          ) : null}

          {visibleToolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id ?? tc.name}
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
}: ChatMessageProps) {
  if (message.getType() === "human") {
    return <HumanMessageBubble message={message} />;
  }

  if (message.getType() === "ai") {
    return (
      <AIMessageView
        message={message as AIMessage}
        isStreaming={isStreaming}
      />
    );
  }

  return null;
});
