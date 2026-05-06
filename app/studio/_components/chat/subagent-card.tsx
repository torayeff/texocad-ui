import React from "react";
import { AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { useMessages, useToolCalls } from "@langchain/react";
import type { AnyStream, AssembledToolCall, SubagentDiscoverySnapshot } from "@langchain/react";
import { Bot, ChevronDown, CircleCheck, CircleDot, CircleX } from "lucide-react";
import type { StreamToolCall } from "@/app/studio/_components/chat/tool-call-card";
import { ToolCallCard } from "@/app/studio/_components/chat/tool-call-card";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_lib/message-content";
import { AIPanel } from "@/app/studio/_components/chat/ai-panel";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/inline-blocks";
import type { MessageUsage } from "@/app/studio/_lib/message-rows";

function toStreamToolCalls(toolCalls: AssembledToolCall[]): StreamToolCall[] {
  return toolCalls
    .filter((toolCall) => toolCall.name !== "task" && toolCall.name !== "write_todos")
    .map((toolCall) => ({
      id: toolCall.callId,
      state: "pending",
      call: {
        id: toolCall.callId,
        name: toolCall.name,
        args: typeof toolCall.input === "object" && toolCall.input !== null
          ? toolCall.input as Record<string, unknown>
          : {},
      },
    }));
}

function getDisplayContent(
  messages: BaseMessage[],
  output: unknown,
): { text: string; thinking: string } {
  let text = "";
  let thinking = "";

  if (typeof output === "string") {
    text = output;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
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
  stream,
  subagent,
  status,
  parentIsStreaming,
}: {
  stream: AnyStream;
  subagent: SubagentDiscoverySnapshot;
  status?: "pending" | "running" | "complete" | "error";
  parentIsStreaming?: boolean;
}) {
  const messages = useMessages(stream, subagent);
  const toolCalls = useToolCalls(stream, subagent);
  const resolvedStatus = status ?? subagent.status;
  const title = subagent.name;
  const isStreaming = resolvedStatus === "running" && !!parentIsStreaming;
  const style = STATUS_STYLES[resolvedStatus];
  const StatusIcon = style.icon;
  const [isOpen, setIsOpen] = React.useState(
    resolvedStatus === "error",
  );

  React.useEffect(() => {
    if (resolvedStatus === "error") {
      setIsOpen(true);
      return;
    }

    if (resolvedStatus === "complete") {
      setIsOpen(false);
    }
  }, [resolvedStatus]);

  const shouldRenderDetails = isOpen || isStreaming || resolvedStatus === "error";
  const inputArgs = subagent.taskInput ? { task: subagent.taskInput } : {};
  const hasInputArgs = Object.keys(inputArgs).length > 0;

  const cachedDetails = React.useMemo(() => {
    const { text: displayContent, thinking } = getDisplayContent(messages, subagent.output);
    const visibleToolCalls = toStreamToolCalls(toolCalls);
    const usage = messages.reduce<MessageUsage>(
      (acc, m) => {
        if (AIMessage.isInstance(m) && m.usage_metadata) {
          acc.inputTokens += m.usage_metadata.input_tokens || 0;
          acc.outputTokens += m.usage_metadata.output_tokens || 0;
          acc.reasoningTokens = (acc.reasoningTokens ?? 0) + (m.usage_metadata.output_token_details?.reasoning || 0);
        }
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
    );
    return { displayContent, thinking, visibleToolCalls, usage };
  }, [messages, subagent.output, toolCalls]);

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
                {JSON.stringify(inputArgs, null, 2)}
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
