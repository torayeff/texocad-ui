"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, ChevronDown } from "lucide-react";
import { useAutoScroll } from "@/app/hooks/chat/use-auto-scroll";
import { useAutoOpenDetails } from "@/app/hooks/chat/use-auto-open-details";

const REMARK_PLUGINS = [remarkGfm];

export const InlineThinkingBlock = React.memo(function InlineThinkingBlock({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const { isOpen, handleToggle } = useAutoOpenDetails(false);
  const [scrollRef, handleScroll] = useAutoScroll<HTMLDivElement>(isStreaming);

  if (!content && !isStreaming) return null;

  return (
    <details
      open={isOpen}
      onToggle={handleToggle}
      className="group/thinking"
    >
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Brain size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span>{isStreaming ? "Thinking" : "Thoughts"}</span>
        <div className="flex items-center gap-1">
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 opacity-0 transition-[opacity,transform] group-hover/thinking:opacity-60 group-open/thinking:rotate-180 group-open/thinking:opacity-60"
          />
        </div>
      </summary>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-2 max-h-60 overflow-y-auto border-l border-border/30 pl-4"
      >
        <div className="prose-chat text-muted-foreground">
          {content ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-[inherit] m-0">{content}</pre>
          ) : (
            <p className="text-muted-foreground/50 italic">Processing...</p>
          )}
        </div>
      </div>
    </details>
  );
});

export const InlineTextContent = React.memo(function InlineTextContent({
  content,
  isStreaming = false,
  renderMarkdown = false,
}: {
  content: string;
  isStreaming?: boolean;
  renderMarkdown?: boolean;
}) {
  if (!content.trim()) return null;

  return (
    <div className="prose-chat">
      {isStreaming || !renderMarkdown ? (
        <pre className="whitespace-pre-wrap break-words font-sans text-[inherit] m-0">{content}</pre>
      ) : (
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>
      )}
    </div>
  );
});
