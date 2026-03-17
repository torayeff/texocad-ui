import React from "react";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import type { AIMessageChunk } from "@langchain/core/messages";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { Bot, ChevronDown, CircleCheck, CircleDot, CircleX } from "lucide-react";
import type { StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_lib/message-content";
import { AIPanel } from "@/app/studio/_components/chat/AIPanel";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";

function getSubagentToolCalls(subagent: ClassSubagentStreamInterface): StreamToolCall[] {
  const allToolCalls: StreamToolCall[] = [];

  for (const message of subagent.messages) {
    if (AIMessage.isInstance(message) && message.tool_calls) {
      for (const tc of message.tool_calls) {
        if (tc.name === "task" || tc.name === "write_todos") continue;

        allToolCalls.push({
          id: tc.id!,
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
  }

  for (const message of subagent.messages) {
    if (ToolMessage.isInstance(message)) {
      const tc = allToolCalls.find((t) => t.id === message.tool_call_id);
      if (tc) {
        tc.result = { content: message.content };
        tc.state = "completed";
      }
    }
  }

  for (const message of subagent.messages) {
    const chunk = message as AIMessageChunk;
    if (AIMessage.isInstance(message) && chunk.tool_call_chunks) {
      for (const tcc of chunk.tool_call_chunks) {
        if (tcc.name === "task" || tcc.name === "write_todos") continue;
        const existing = allToolCalls.find((t) => t.id === tcc.id);
        if (!existing && tcc.id) {
          let parsedArgs = {};
          if (tcc.args) {
            try {
              parsedArgs = JSON.parse(tcc.args);
            } catch {
              // partial JSON from streaming chunk
            }
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
  }

  return allToolCalls;
}

function getElapsedLabel(
  startedAt: Date | null | undefined,
  completedAt: Date | null | undefined,
): string | null {
  if (!startedAt) return null;

  const end = completedAt ?? new Date();
  const seconds = Math.max(0, Math.round((end.getTime() - startedAt.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getDisplayContent(subagent: ClassSubagentStreamInterface): { text: string; thinking: string } {
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
}: {
  subagent: ClassSubagentStreamInterface;
  status?: "pending" | "running" | "complete" | "error";
}) {
  const resolvedStatus = status ?? subagent.status;
  const title = typeof subagent.toolCall.args.subagent_type === "string"
    ? subagent.toolCall.args.subagent_type
    : subagent.toolCall.name;
  const { text: displayContent, thinking } = getDisplayContent(subagent);
  const isStreaming = resolvedStatus === "running";
  const elapsed = getElapsedLabel(subagent.startedAt, subagent.completedAt);
  const style = STATUS_STYLES[resolvedStatus];
  const StatusIcon = style.icon;
  const [isOpen, setIsOpen] = React.useState(
    resolvedStatus === "error",
  );
  const visibleToolCalls = getSubagentToolCalls(subagent);

  const fixedSeconds = React.useMemo(() => {
    if (!subagent.startedAt) return undefined;
    const end = subagent.completedAt ?? new Date();
    return Math.max(0, Math.round((end.getTime() - subagent.startedAt.getTime()) / 1000));
  }, [subagent.startedAt, subagent.completedAt]);

  const usage = React.useMemo(() => {
    return subagent.messages.reduce(
      (acc, m) => {
        if (AIMessage.isInstance(m) && m.usage_metadata) {
          acc.inputTokens += m.usage_metadata.input_tokens || 0;
          acc.outputTokens += m.usage_metadata.output_tokens || 0;
          acc.reasoningTokens += m.usage_metadata.output_token_details?.reasoning || 0;
        }
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, runtimeSeconds: fixedSeconds }
    );
  }, [subagent.messages, fixedSeconds]);

  React.useEffect(() => {
    if (resolvedStatus === "error") {
      setIsOpen(true);
      return;
    }

    if (resolvedStatus === "complete") {
      setIsOpen(false);
    }
  }, [resolvedStatus]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
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
          {resolvedStatus === "running" ? (
            <PanelTimer active={true} />
          ) : elapsed ? (
            <span className="font-mono text-[10px]">{elapsed}</span>
          ) : null}
          <StatusIcon size={14} className={style.iconClass} />
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/subagent:rotate-180"
          />
        </div>
      </summary>

      <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
        {subagent.toolCall.args && Object.keys(subagent.toolCall.args).length > 0 ? (
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

        {thinking || (isStreaming && !displayContent) || displayContent || visibleToolCalls.length > 0 ? (
          <div className="space-y-1.5">
            <AIPanel
              hideHeader
              statusLabel={resolvedStatus === "running" ? "Working" : null}
              isStreaming={resolvedStatus === "running"}
              usage={usage}
            >
              {thinking || (isStreaming && !displayContent) ? (
                <InlineThinkingBlock
                  content={thinking}
                  isStreaming={isStreaming && !displayContent}
                  defaultOpen={false}
                  fixedSeconds={!isStreaming ? usage.runtimeSeconds : undefined}
                />
              ) : null}

              {visibleToolCalls.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {visibleToolCalls.map((toolCall) => (
                    <ToolCallCard
                      key={toolCall.id}
                      toolCall={toolCall}
                    />
                  ))}
                </div>
              ) : null}

              {displayContent ? (
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
                    <InlineTextContent content={displayContent} isStreaming={isStreaming} />
                  </div>
                </details>
              ) : null}
            </AIPanel>
          </div>
        ) : null}
      </div>
    </details>
  );
});
