"use client";

import React from "react";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import type { AIMessageChunk } from "@langchain/core/messages";
import { Bot, ChevronDown, CircleCheck, CircleDot, CircleX } from "lucide-react";
import { ToolCallCard } from "@/app/studio/_features/chat/_components/tool-call-card";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_features/chat/_lib/message-content";
import { AIPanel } from "@/app/studio/_features/chat/_components/ai-panel";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_features/chat/_components/inline-blocks";
import { useAutoOpenDetails } from "@/app/studio/_features/chat/_hooks/use-auto-open-details";
import type { StreamToolCall } from "@/app/studio/_features/chat/_types/chat";
import type { SubagentStatus, SubagentStream } from "@/app/studio/_features/chat/_types/subagent";

function getSubagentToolCalls(subagent: SubagentStream): StreamToolCall[] {
  const allToolCalls: StreamToolCall[] = [];
  const knownIds = new Set<string>();

  for (const message of subagent.messages) {
    if (AIMessage.isInstance(message) && message.tool_calls) {
      for (const tc of message.tool_calls) {
        if (!tc.id || tc.name === "task" || tc.name === "write_todos") continue;
        knownIds.add(tc.id);
        allToolCalls.push({
          id: tc.id,
          state: "completed",
          call: {
            id: tc.id,
            name: tc.name,
            args: tc.args as Record<string, unknown>,
          },
          result: "",
        });
      }
    }

    if (ToolMessage.isInstance(message)) {
      const tc = allToolCalls.find((t) => t.id === message.tool_call_id);
      if (tc) {
        tc.result = { content: message.content, status: message.status };
        tc.state = message.status === "error" ? "error" : "completed";
      }
    }

    const chunk = message as AIMessageChunk;
    if (AIMessage.isInstance(message) && chunk.tool_call_chunks) {
      for (const tcc of chunk.tool_call_chunks) {
        if (!tcc.id || tcc.name === "task" || tcc.name === "write_todos") continue;
        if (knownIds.has(tcc.id)) continue;
        knownIds.add(tcc.id);
        let parsedArgs = {};
        if (tcc.args) {
          try { parsedArgs = JSON.parse(tcc.args); } catch { /* partial JSON */ }
        }
        allToolCalls.push({
          id: tcc.id,
          state: "pending",
          call: {
            id: tcc.id,
            name: tcc.name!,
            args: parsedArgs,
          },
        });
      }
    }
  }

  return allToolCalls;
}

function getDisplayContent(subagent: SubagentStream): { text: string; thinking: string } {
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
  subagent: SubagentStream;
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
  const { isOpen, handleToggle } = useAutoOpenDetails(isStreaming);
  const shouldRenderDetails = isOpen;
  const hasInputArgs = Object.keys(subagent.toolCall.args).length > 0;

  const cachedDetails = React.useMemo(() => {
    const { text: displayContent, thinking } = getDisplayContent(subagent);
    const visibleToolCalls = getSubagentToolCalls(subagent);
    const usage = subagent.messages.reduce(
      (acc, m) => {
        if (AIMessage.isInstance(m) && m.usage_metadata) {
          acc.inputTokens += m.usage_metadata.input_tokens || 0;
          acc.outputTokens += m.usage_metadata.output_tokens || 0;
          acc.reasoningTokens += m.usage_metadata.output_token_details?.reasoning || 0;
        }
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
    );
    return { displayContent, thinking, visibleToolCalls, usage };
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
        <div className="ml-auto flex items-center gap-1.5">
          <StatusIcon size={14} className={style.iconClass} />
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/subagent:rotate-180"
          />
        </div>
      </summary>

      {shouldRenderDetails ? (
        <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
          {hasInputArgs ? (
            <details className="group/input">
              <summary className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70 cursor-pointer">
                <span>Input</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <ChevronDown
                    size={13}
                    className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/input:rotate-180"
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
                statusLabel={resolvedStatus === "running" ? "Working" : null}
                isStreaming={resolvedStatus === "running"}
                usage={detailState?.usage}
              >
                {detailState?.thinking || (isStreaming && !detailState?.displayContent) ? (
                  <InlineThinkingBlock
                    content={detailState?.thinking ?? ""}
                    isStreaming={isStreaming}
                    defaultOpen={false}
                  />
                ) : null}

                {detailState?.visibleToolCalls.length ? (
                  <div className="flex flex-col gap-2">
                    {detailState.visibleToolCalls.map((toolCall) => (
                      <ToolCallCard
                        key={toolCall.id}
                        toolCall={toolCall}
                        isStreaming={isStreaming}
                      />
                    ))}
                  </div>
                ) : null}

                {detailState?.displayContent ? (
                  <details className="group/final-text">
                    <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                      <span>Final response</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <ChevronDown
                          size={13}
                          className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/final-text:rotate-180"
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
