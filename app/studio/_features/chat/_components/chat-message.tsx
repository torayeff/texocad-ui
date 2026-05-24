import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIPanel } from "@/app/studio/_features/chat/_components/ai-panel";
import { ToolCallCard } from "@/app/studio/_features/chat/_components/tool-call-card";
import { ToolPreviewCard } from "@/app/studio/_features/chat/_components/tool-preview-card";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_features/chat/_components/inline-blocks";
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
const HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES = ["Input image:", "Mask:"];
const MARKDOWN_IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const MARKDOWN_LINK_LINE = /^\[([^\]]+)\]\(([^)]+)\)$/;
const MASK_LINE_PREFIX = "Mask:";

interface HumanAttachment {
  filename: string;
  isImage: boolean;
  url: string;
}

interface HumanMessageParts {
  attachments: HumanAttachment[];
  text: string;
}

function isHiddenHumanMessageLine(line: string) {
  return HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function parseMaskLine(line: string): HumanAttachment | null {
  if (!line.startsWith(MASK_LINE_PREFIX)) return null;
  const url = line.slice(MASK_LINE_PREFIX.length).trim();
  if (!url) return null;

  return {
    filename: "Mask",
    isImage: true,
    url,
  };
}

function parseAttachmentLine(line: string): HumanAttachment | null {
  const imageMatch = line.match(MARKDOWN_IMAGE_LINE);
  if (imageMatch) {
    return {
      filename: imageMatch[1] || "Attachment image",
      isImage: true,
      url: imageMatch[2],
    };
  }

  const linkMatch = line.match(MARKDOWN_LINK_LINE);
  if (!linkMatch) return null;

  return {
    filename: linkMatch[1],
    isImage: false,
    url: linkMatch[2],
  };
}

function humanMessageDisplayParts(content: string): HumanMessageParts {
  const attachments: HumanAttachment[] = [];
  const lines = content
    .split("\n")
    .filter((line) => {
      const maskAttachment = parseMaskLine(line);
      if (maskAttachment) {
        attachments.push(maskAttachment);
        return false;
      }

      if (isHiddenHumanMessageLine(line)) return false;

      const attachment = parseAttachmentLine(line.trim());
      if (attachment) {
        attachments.push(attachment);
        return false;
      }

      return line.trim() !== "Attachments:";
    });

  return {
    attachments,
    text: lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}

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
