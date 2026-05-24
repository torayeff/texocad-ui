import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIPanel } from "@/app/studio/_features/chat/_components/ai-panel";
import { ToolCallCard } from "@/app/studio/_features/chat/_components/tool-call-card";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_features/chat/_components/inline-blocks";
import type { MessageUsage } from "@/app/studio/_features/chat/_lib/message-rows";
import type { ChatMessageType, StreamToolCall } from "@/app/studio/_features/chat/_types/chat";

interface ChatMessageProps {
  messageType: ChatMessageType;
  textContent: string;
  thinkingContent?: string;
  agentName?: string;
  usage?: MessageUsage;
  isStreaming?: boolean;
  startedAtMs?: number;
  toolCalls?: StreamToolCall[];
  forcePanelShell?: boolean;
  renderMarkdown?: boolean;
  children?: React.ReactNode;
}

const REMARK_PLUGINS = [remarkGfm];
const HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES = ["Input image:", "Mask:"];

function isHiddenHumanMessageLine(line: string) {
  return HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function humanMessageDisplayContent(content: string) {
  return content
    .split("\n")
    .filter((line) => !isHiddenHumanMessageLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function HumanMessageBubble({ content }: { content: string }) {
  const displayContent = humanMessageDisplayContent(content);

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
              img: ({ src, alt }) => (
                // eslint-disable-next-line @next/next/no-img-element -- Chat attachments use user-scoped blob URLs that are not configured for Next image optimization.
                <img
                  src={src ?? ""}
                  alt={alt ?? "Attachment image"}
                  className="mt-2 max-h-40 max-w-full rounded-xl border border-border/40 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function AIMessageView({
  agentName = "",
  textContent,
  thinkingContent = "",
  usage,
  isStreaming,
  startedAtMs,
  toolCalls,
  forcePanelShell,
  renderMarkdown,
  children,
}: {
  agentName?: string;
  textContent: string;
  thinkingContent?: string;
  usage?: MessageUsage;
  isStreaming: boolean;
  startedAtMs?: number;
  toolCalls: StreamToolCall[];
  forcePanelShell: boolean;
  renderMarkdown: boolean;
  children?: React.ReactNode;
}) {
  const hasText = textContent.trim().length > 0;
  const hasToolCalls = toolCalls.length > 0;
  const hasThinking = thinkingContent.trim().length > 0;

  let statusLabel: string | null = null;
  if (hasThinking && isStreaming) statusLabel = "Thinking";
  else if (isStreaming) statusLabel = "Working";

  if (!hasText && !hasToolCalls && !hasThinking && !isStreaming && !forcePanelShell) return null;

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      timerStartedAtMs={startedAtMs}
      usage={usage}
    >
      {hasThinking || (isStreaming && !hasText) ? (
        <InlineThinkingBlock
          content={thinkingContent}
          isStreaming={isStreaming}
          defaultOpen={false}
        />
      ) : null}

      {hasToolCalls ? (
        <div className="flex flex-col gap-2">
          {toolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id}
              toolCall={tc}
              isStreaming={isStreaming}
            />
          ))}
        </div>
      ) : null}

      {hasText ? (
        <InlineTextContent
          content={textContent}
          isStreaming={isStreaming}
          renderMarkdown={renderMarkdown}
        />
      ) : null}

      {children}
    </AIPanel>
  );
}

export const ChatMessage = React.memo(function ChatMessage({
  messageType,
  textContent,
  thinkingContent = "",
  agentName,
  usage,
  isStreaming = false,
  startedAtMs,
  toolCalls = [],
  forcePanelShell = false,
  renderMarkdown = false,
  children,
}: ChatMessageProps) {
  if (messageType === "human") {
    return <HumanMessageBubble content={textContent} />;
  }

  return (
    <AIMessageView
      agentName={agentName}
      textContent={textContent}
      thinkingContent={thinkingContent}
      usage={usage}
      isStreaming={isStreaming}
      startedAtMs={startedAtMs}
      toolCalls={toolCalls}
      forcePanelShell={forcePanelShell}
      renderMarkdown={renderMarkdown}
    >
      {children}
    </AIMessageView>
  );
});
