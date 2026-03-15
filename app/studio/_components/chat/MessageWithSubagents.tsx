import React from "react";
import { Loader2 } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-3">
      <ChatMessage
        message={message}
        isStreaming={isStreaming}
        toolCalls={visibleToolCalls}
        forcePanelShell={AIMessage.isInstance(message) && subagents.length > 0}
      >
        {AIMessage.isInstance(message) && subagents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {subagentEntries.map(({ subagent, status }) => (
              <SubagentCard
                key={subagent.id}
                subagent={subagent}
                status={status}
              />
            ))}
          </div>
        ) : null}
      </ChatMessage>
    </div>
  );
});
