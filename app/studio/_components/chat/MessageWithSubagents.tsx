import React from "react";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { ChatMessage } from "@/app/studio/_components/chat/ChatMessage";
import { SubagentCard } from "@/app/studio/_components/chat/SubagentCard";
import type { StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";

function getVisibleToolCalls(
  toolCalls: StreamToolCall[],
  subagentCount: number,
): StreamToolCall[] {
  return toolCalls.filter((toolCall) =>
    toolCall.call.name !== "write_todos"
    && (toolCall.call.name !== "task" || subagentCount === 0));
}

function getSubagentStatus(
  subagent: ClassSubagentStreamInterface,
  toolCalls: StreamToolCall[],
): "pending" | "running" | "complete" | "error" {
  const parentTask = toolCalls.find((toolCall) =>
    toolCall.call.name === "task"
    && (toolCall.call.id === subagent.id || toolCall.id === subagent.id));

  if (parentTask?.state === "error") return "error";
  if (parentTask?.state === "completed") return "complete";
  return subagent.status;
}

export const MessageWithSubagents = React.memo(function MessageWithSubagents({
  message,
  isStreaming = false,
  toolCalls = [],
  subagents = [],
  isParentStreamLoading = false,
}: {
  message: BaseMessage;
  isStreaming?: boolean;
  toolCalls?: StreamToolCall[];
  subagents?: ClassSubagentStreamInterface[];
  isParentStreamLoading?: boolean;
}) {
  const visibleToolCalls = getVisibleToolCalls(toolCalls, subagents.length);
  const subagentEntries = subagents.map((subagent) => ({
    subagent,
    status: getSubagentStatus(subagent, toolCalls),
  }));
  const completedCount = subagentEntries.filter(
    ({ status }) => status === "complete" || status === "error",
  ).length;
  const progressPercentage = subagents.length > 0
    ? Math.round((completedCount / subagents.length) * 100)
    : 0;
  const isSynthesizing = subagentEntries.length > 0
    && completedCount === subagents.length
    && isParentStreamLoading;

  return (
    <div className="flex flex-col gap-3">
      <ChatMessage
        message={message}
        isStreaming={isStreaming}
        toolCalls={visibleToolCalls}
        forcePanelShell={AIMessage.isInstance(message) && subagents.length > 0}
      />

      {AIMessage.isInstance(message) && subagents.length > 0 ? (
        <div className="ml-5 flex flex-col gap-3 border-l border-border/40 pl-4">
          <div className="rounded-xl border border-border/40 bg-muted/10 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Subagent progress</span>
              <span>
                {completedCount}/{subagents.length} complete
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {subagentEntries.map(({ subagent, status }) => (
            <SubagentCard
              key={subagent.id}
              subagent={subagent}
              status={status}
            />
          ))}

          {isSynthesizing ? (
            <div className="rounded-xl border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              Synthesizing results from {subagents.length} subagent{subagents.length === 1 ? "" : "s"}...
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
