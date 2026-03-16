import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { AIPanel } from "@/app/studio/_components/chat/AIPanel";
import { ToolCallCard, type StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_lib/message-content";

interface ChatMessageProps {
  message: BaseMessage;
  isStreaming?: boolean;
  toolCalls?: StreamToolCall[];
  forcePanelShell?: boolean;
  children?: React.ReactNode;
}

const REMARK_PLUGINS = [remarkGfm];

function HumanMessageBubble({ message }: { message: BaseMessage }) {
  const text = getMessageTextContent(message);

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <div className="prose-chat text-foreground">
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            components={{
              a: ({ children }) => (
                <span className="font-medium underline decoration-muted-foreground/30 underline-offset-2">
                  {children}
                </span>
              ),
              p: ({ children }) => (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed m-0">
                  {children}
                </p>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function AIMessageView({
  message,
  isStreaming,
  toolCalls,
  forcePanelShell,
  children,
}: {
  message: AIMessage;
  isStreaming: boolean;
  toolCalls: StreamToolCall[];
  forcePanelShell: boolean;
  children?: React.ReactNode;
}) {
  const text = getMessageTextContent(message);
  const thinking = getReasoningContent(message);

  const hasText = text.trim().length > 0;
  const hasToolCalls = toolCalls.length > 0;
  const hasThinking = thinking.trim().length > 0;

  let statusLabel: string | null = null;
  if (thinking && isStreaming) statusLabel = "Thinking";
  else if (isStreaming) statusLabel = "Working";

  const agentName = message.name ?? "";
  const usage = message.usage_metadata;

  if (!hasText && !hasToolCalls && !hasThinking && !isStreaming && !forcePanelShell) return null;

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
      {thinking || (isStreaming && !hasText) ? (
        <InlineThinkingBlock
          content={thinking}
          isStreaming={isStreaming && !hasText}
          defaultOpen={false}
        />
      ) : null}

      {hasToolCalls ? (
        <div className="flex flex-col gap-2">
          {toolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id}
              toolCall={tc}
            />
          ))}
        </div>
      ) : null}

      {hasText ? <InlineTextContent content={text} isStreaming={isStreaming} /> : null}

      {children}
    </AIPanel>
  );
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  toolCalls = [],
  forcePanelShell = false,
  children,
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
      >
        {children}
      </AIMessageView>
    );
  }

  return null;
});
