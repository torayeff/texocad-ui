"use client";

import React from "react";
import { ChatMessage } from "@/app/studio/_features/chat/_components/chat-message";
import { SubagentCard } from "@/app/studio/_features/chat/_components/subagent-card";
import type { ChatMessageType, StreamToolCall } from "@/app/studio/_features/chat/_types/chat";
import type { SubagentStatus, SubagentStream } from "@/app/studio/_features/chat/_types/subagent";

function getVisibleToolCalls(
  toolCalls: StreamToolCall[],
  subagentCount: number,
): StreamToolCall[] {
  return toolCalls.filter((toolCall) =>
    toolCall.call.name !== "write_todos"
    && (toolCall.call.name !== "task" || subagentCount === 0));
}

function getSubagentStatus(
  subagent: SubagentStream,
  toolCalls: StreamToolCall[],
): SubagentStatus {
  const parentTask = toolCalls.find((toolCall) =>
    toolCall.call.name === "task"
    && (toolCall.call.id === subagent.id || toolCall.id === subagent.id));

  if (parentTask?.state === "error") return "error";
  if (parentTask?.state === "completed") return "complete";
  return subagent.status;
}

interface MessageWithSubagentsProps {
  messageType: ChatMessageType;
  textContent: string;
  thinkingContent?: string;
  agentName?: string;
  isStreaming?: boolean;
  runtimeSeconds?: number;
  startedAtMs?: number;
  toolCalls?: StreamToolCall[];
  subagents?: SubagentStream[];
  toolCallsSignature?: string;
  subagentsSignature?: string;
  renderMarkdown?: boolean;
}

export const MessageWithSubagents = React.memo(function MessageWithSubagents({
  messageType,
  textContent,
  thinkingContent = "",
  agentName,
  isStreaming = false,
  runtimeSeconds,
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
        isStreaming={isStreaming}
        runtimeSeconds={runtimeSeconds}
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
  && prevProps.isStreaming === nextProps.isStreaming
  && prevProps.runtimeSeconds === nextProps.runtimeSeconds
  && prevProps.startedAtMs === nextProps.startedAtMs
  && prevProps.renderMarkdown === nextProps.renderMarkdown
  && prevProps.toolCallsSignature === nextProps.toolCallsSignature
  && prevProps.subagentsSignature === nextProps.subagentsSignature,
);
