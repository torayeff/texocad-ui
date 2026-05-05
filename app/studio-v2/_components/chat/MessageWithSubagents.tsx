import React from "react";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { ChatMessage, type ChatMessageType } from "@/app/studio-v2/_components/chat/ChatMessage";
import type { MessageUsage } from "@/app/studio-v2/_lib/message-rows";
import { SubagentCard } from "@/app/studio-v2/_components/chat/SubagentCard";
import type { StreamToolCall } from "@/app/studio-v2/_components/chat/ToolCallCard";

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

function areUsageEqual(prev?: MessageUsage, next?: MessageUsage): boolean {
  return prev?.inputTokens === next?.inputTokens
    && prev?.outputTokens === next?.outputTokens
    && prev?.reasoningTokens === next?.reasoningTokens
    && prev?.runtimeSeconds === next?.runtimeSeconds;
}

interface MessageWithSubagentsProps {
  messageType: ChatMessageType;
  textContent: string;
  thinkingContent?: string;
  agentName?: string;
  usage?: MessageUsage;
  isStreaming?: boolean;
  startedAtMs?: number;
  toolCalls?: StreamToolCall[];
  subagents?: ClassSubagentStreamInterface[];
  toolCallsSignature?: string;
  subagentsSignature?: string;
  renderMarkdown?: boolean;
}

export const MessageWithSubagents = React.memo(function MessageWithSubagents({
  messageType,
  textContent,
  thinkingContent = "",
  agentName,
  usage,
  isStreaming = false,
  startedAtMs,
  toolCalls = [],
  subagents = [],
  renderMarkdown = false,
}: MessageWithSubagentsProps) {
  const visibleToolCalls = React.useMemo(
    () => getVisibleToolCalls(toolCalls, subagents.length),
    [toolCalls, subagents.length],
  );
  const subagentEntries = React.useMemo(
    () => subagents.map((subagent) => ({
      subagent,
      status: getSubagentStatus(subagent, toolCalls),
    })),
    [subagents, toolCalls],
  );

  return (
    <div className="flex flex-col gap-3">
      <ChatMessage
        messageType={messageType}
        textContent={textContent}
        thinkingContent={thinkingContent}
        agentName={agentName}
        usage={usage}
        isStreaming={isStreaming}
        startedAtMs={startedAtMs}
        toolCalls={visibleToolCalls}
        forcePanelShell={messageType === "ai" && subagents.length > 0}
        renderMarkdown={renderMarkdown}
      >
        {messageType === "ai" && subagents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {subagentEntries.map(({ subagent, status }) => (
              <SubagentCard
                key={subagent.id}
                subagent={subagent}
                status={status}
                parentIsStreaming={isStreaming}
              />
            ))}
          </div>
        ) : null}
      </ChatMessage>
    </div>
  );
}, (prevProps, nextProps) =>
  prevProps.messageType === nextProps.messageType
  && prevProps.textContent === nextProps.textContent
  && prevProps.thinkingContent === nextProps.thinkingContent
  && prevProps.agentName === nextProps.agentName
  && areUsageEqual(prevProps.usage, nextProps.usage)
  && prevProps.isStreaming === nextProps.isStreaming
  && prevProps.startedAtMs === nextProps.startedAtMs
  && prevProps.renderMarkdown === nextProps.renderMarkdown
  && prevProps.toolCallsSignature === nextProps.toolCallsSignature
  && prevProps.subagentsSignature === nextProps.subagentsSignature,
);
