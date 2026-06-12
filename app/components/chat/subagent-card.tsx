"use client";

import React from "react";
import { AIMessage } from "@langchain/core/messages";
import { Bot, ChevronDown, CircleCheck, CircleDot, CircleX } from "lucide-react";
import { ToolCallCard } from "@/app/components/chat/tool-call-card";
import { getMessageTextContent, getReasoningContent } from "@/app/lib/chat/message-content";
import { AIPanel } from "@/app/components/chat/ai-panel";
import { InlineThinkingBlock, InlineTextContent } from "@/app/components/chat/inline-blocks";
import { useAutoOpenDetails } from "@/app/hooks/chat/use-auto-open-details";
import type { SubagentStatus, SubagentView } from "@/app/lib/chat/message-rows";

function getDisplayContent(subagent: SubagentView): { text: string; thinking: string } {
  let text = "";
  let thinking = "";

  if (subagent.result?.trim()) {
    text = subagent.result;
  }

  for (let index = subagent.messages.length - 1; index >= 0; index -= 1) {
    const message = subagent.messages[index];
    if (!AIMessage.isInstance(message)) continue;

    if (!text) {
      const msgText = getMessageTextContent(message);
      if (msgText.trim()) text = msgText;
    }

    if (!thinking) {
      const msgThinking = getReasoningContent(message);
      if (msgThinking.trim()) thinking = msgThinking;
    }

    if (text && thinking) break;
  }

  return { text, thinking };
}

const STATUS_STYLES = {
  pending: {
    icon: CircleDot,
    iconClass: "text-muted-foreground/70",
    badgeClass: "bg-muted text-muted-foreground",
  },
  running: {
    icon: CircleDot,
    iconClass: "text-success animate-pulse",
    badgeClass: "bg-success/10 text-success",
  },
  complete: {
    icon: CircleCheck,
    iconClass: "text-success",
    badgeClass: "bg-success/10 text-success",
  },
  error: {
    icon: CircleX,
    iconClass: "text-error",
    badgeClass: "bg-error/10 text-error",
  },
} as const;

export const SubagentCard = React.memo(function SubagentCard({
  subagent,
  status,
  parentIsStreaming,
}: {
  subagent: SubagentView;
  status?: SubagentStatus;
  parentIsStreaming?: boolean;
}) {
  const resolvedStatus = status ?? subagent.status;
  const title = typeof subagent.toolCall.args.subagent_type === "string"
    ? subagent.toolCall.args.subagent_type
    : subagent.toolCall.name;
  const isStreaming = resolvedStatus === "running" && !!parentIsStreaming;
  const style = STATUS_STYLES[resolvedStatus];
  const StatusIcon = style.icon;
  const { isOpen, handleToggle } = useAutoOpenDetails(false);
  const shouldRenderDetails = isOpen;
  const hasInputArgs = Object.keys(subagent.toolCall.args).length > 0;

  const cachedDetails = React.useMemo(() => {
    const { text: displayContent, thinking } = getDisplayContent(subagent);
    const visibleToolCalls = subagent.toolCalls.filter((toolCall) =>
      toolCall.call.name !== "task" && toolCall.call.name !== "write_todos");
    return { displayContent, thinking, visibleToolCalls };
  }, [subagent]);

  const detailState = shouldRenderDetails ? cachedDetails : null;
  const hasDetailPanel = !!detailState && (
    detailState.thinking
    || (isStreaming && !detailState.displayContent)
    || detailState.displayContent
    || detailState.visibleToolCalls.length > 0
  );

  return (
    <details
      open={isOpen}
      onToggle={handleToggle}
      className="group/subagent"
    >
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground/85">
          {title}
        </span>
        {resolvedStatus !== "complete" ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badgeClass}`}>
            {resolvedStatus}
          </span>
        ) : null}
        <div className="flex items-center gap-1">
          <StatusIcon size={14} className={style.iconClass} />
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 opacity-0 transition-[opacity,transform] group-hover/subagent:opacity-60 group-open/subagent:rotate-180 group-open/subagent:opacity-60"
          />
        </div>
      </summary>

      {shouldRenderDetails ? (
        <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
          {hasInputArgs ? (
            <details className="group/input">
              <summary className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70 cursor-pointer">
                <span>Input</span>
                <div className="flex items-center gap-1">
                  <ChevronDown
                    size={13}
                    className="flex-shrink-0 text-muted-foreground/40 opacity-0 transition-[opacity,transform] group-hover/input:opacity-60 group-open/input:rotate-180 group-open/input:opacity-60"
                  />
                </div>
              </summary>
              <pre className="mt-1 max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground">
                {JSON.stringify(subagent.toolCall.args, null, 2)}
              </pre>
            </details>
          ) : null}

          {hasDetailPanel ? (
            <div className="space-y-1.5">
              <AIPanel
                hideHeader
                agentName=""
                statusLabel={resolvedStatus === "running" ? "Working" : null}
                isStreaming={resolvedStatus === "running"}
              >
                {detailState?.thinking || (isStreaming && !detailState?.displayContent) ? (
                  <InlineThinkingBlock
                    content={detailState?.thinking ?? ""}
                    isStreaming={isStreaming}
                  />
                ) : null}

                {detailState?.visibleToolCalls.length ? (
                  <div className="flex flex-col gap-2">
                    {detailState.visibleToolCalls.map((toolCall) => (
                      <ToolCallCard
                        key={toolCall.id}
                        toolCall={toolCall}
                      />
                    ))}
                  </div>
                ) : null}

                {detailState?.displayContent ? (
                  <details className="group/final-text">
                    <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                      <span>Final response</span>
                      <div className="flex items-center gap-1">
                        <ChevronDown
                          size={13}
                          className="flex-shrink-0 text-muted-foreground/40 opacity-0 transition-[opacity,transform] group-hover/final-text:opacity-60 group-open/final-text:rotate-180 group-open/final-text:opacity-60"
                        />
                      </div>
                    </summary>
                    <div className="mt-2 border-l border-border/30 pl-4">
                      <InlineTextContent content={detailState.displayContent} isStreaming={isStreaming} />
                    </div>
                  </details>
                ) : null}
              </AIPanel>
            </div>
          ) : null}
        </div>
      ) : null}
    </details>
  );
});
