import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIPanel } from "@/app/studio/_features/chat/_components/ai-panel";
import { ToolCallCard } from "@/app/studio/_features/chat/_components/tool-call-card";
import { ToolPreviewCard } from "@/app/studio/_features/chat/_components/tool-preview-card";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_features/chat/_components/inline-blocks";
import {
  humanMessageDisplayParts,
  type HumanAttachment,
} from "@/app/studio/_features/chat/_lib/message-attachments";
import { useSignedAttachmentUrl } from "@/app/studio/_features/chat/_lib/signed-attachment-url";
import type { ChatMessageType, StreamToolCall } from "@/app/studio/_features/chat/_types/chat";

interface ChatMessageProps {
  messageType: ChatMessageType;
  textContent: string;
  thinkingContent?: string;
  agentName?: string;
  isStreaming?: boolean;
  runtimeSeconds?: number;
  startedAtMs?: number;
  toolCalls?: StreamToolCall[];
  forcePanelShell?: boolean;
  renderMarkdown?: boolean;
  children?: React.ReactNode;
}

const REMARK_PLUGINS = [remarkGfm];

function HumanAttachmentPreview({ attachment }: { attachment: HumanAttachment }) {
  const signedUrl = useSignedAttachmentUrl(attachment.url);

  if (attachment.isImage) {
    return (
      <ToolPreviewCard
        image={{ src: signedUrl, mimeType: "image/*" }}
        label={attachment.filename}
      />
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center rounded-xl border border-border/40 bg-background px-3 py-2 text-xs font-medium text-foreground underline-offset-2 transition-colors hover:border-border hover:bg-muted/25 hover:underline"
    >
      <span className="truncate">{attachment.filename}</span>
    </a>
  );
}

function HumanMessageBubble({ content }: { content: string }) {
  const { attachments, text } = humanMessageDisplayParts(content);

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        {text ? (
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
        ) : null}
        {attachments.length > 0 ? (
          <div className={text ? "mt-2 flex flex-wrap justify-end gap-2" : "flex flex-wrap justify-end gap-2"}>
            {attachments.map((attachment, index) => (
              <HumanAttachmentPreview
                key={`${attachment.url}:${index}`}
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AIMessageView({
  agentName = "",
  textContent,
  thinkingContent = "",
  isStreaming,
  runtimeSeconds,
  startedAtMs,
  toolCalls,
  forcePanelShell,
  renderMarkdown,
  children,
}: {
  agentName?: string;
  textContent: string;
  thinkingContent?: string;
  isStreaming: boolean;
  runtimeSeconds?: number;
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
      runtimeSeconds={runtimeSeconds}
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
  isStreaming = false,
  runtimeSeconds,
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
      isStreaming={isStreaming}
      runtimeSeconds={runtimeSeconds}
      startedAtMs={startedAtMs}
      toolCalls={toolCalls}
      forcePanelShell={forcePanelShell}
      renderMarkdown={renderMarkdown}
    >
      {children}
    </AIMessageView>
  );
});
