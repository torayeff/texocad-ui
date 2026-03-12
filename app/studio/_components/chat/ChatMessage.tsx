import React, { useMemo } from "react";
import type { ChatMessage as ChatMessageType, AIBlock, ToolCallInfo } from "@/app/studio/_types/chat";
import { AIPanel, ActivitySection } from "@/app/studio/_components/chat/AIPanel";
import { SubagentGroup } from "@/app/studio/_components/chat/SubagentGroup";
import { TodoCard } from "@/app/studio/_components/chat/TodoCard";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";
import {
  groupBlocks,
  resolveAgentName,
  getActiveThinkingBlock,
  getActivitySummary,
  getStatusLabel,
  getAnswerBlocks,
  hasVisibleActivity,
} from "@/app/studio/_lib/chat-utils";
import type { BlockGroup } from "@/app/studio/_lib/chat-utils";

export function HumanMessage({
  message,
}: {
  message: ChatMessageType;
}) {
  if (message.role !== "human") return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export function AIMessage({
  message,
  isStreaming,
  visibleTodoCallIdsStr,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
  visibleTodoCallIdsStr?: string;
}) {
  const hasBlocks = message.blocks.length > 0;
  const hasToolCalls = message.toolCalls.length > 0;
  const hasText = message.content.trim().length > 0;

  const toolCallMap = useMemo(() => {
    const map = new Map<string, ToolCallInfo>();
    message.toolCalls.forEach((tc) => map.set(tc.id, tc));
    return map;
  }, [message.toolCalls]);

  const groups = useMemo(() => groupBlocks(message.blocks), [message.blocks]);

  const activitySummary = useMemo(
    () => getActivitySummary(groups, message.toolCalls),
    [groups, message.toolCalls]
  );

  const agentName = resolveAgentName(message);
  const answerBlocks = getAnswerBlocks(message.blocks);
  const statusLabel = getStatusLabel(message, isStreaming);
  const activeThinkingBlock = getActiveThinkingBlock(message.blocks, isStreaming);

  const hasActivity = hasBlocks
    ? hasVisibleActivity(groups, toolCallMap, visibleTodoCallIdsStr)
    : Boolean(message.thinking) || hasToolCalls;

  if (!hasBlocks && !hasToolCalls && !hasText && !isStreaming) return null;

  function renderParentActivityBlock(block: AIBlock, key: string): React.ReactNode {
    switch (block.kind) {
      case "thinking":
        return (
          <InlineThinkingBlock
            key={key}
            content={block.content}
            isStreaming={block === activeThinkingBlock}
            defaultOpen={false}
          />
        );
      case "tool_call": {
        const toolCall = toolCallMap.get(block.toolCallId);
        if (!toolCall) return null;
        if (toolCall.name === "write_todos") {
          if (!visibleTodoCallIdsStr?.includes(toolCall.id)) return null;
          return <TodoCard key={toolCall.id} toolCall={toolCall} />;
        }
        return <ToolCallCard key={toolCall.id} toolCall={toolCall} />;
      }
      case "text":
      case "tool_result":
        return null;
      default: {
        return null;
      }
    }
  }

  if (!hasBlocks) {
    return (
      <AIPanel
        agentName={agentName}
        statusLabel={statusLabel}
        isStreaming={isStreaming}
        usage={message.usage}
      >
        {hasText ? <InlineTextContent content={message.content} /> : null}
        {hasActivity ? (
          <ActivitySection summary={activitySummary}>
            {message.thinking ? (
              <InlineThinkingBlock
                content={message.thinking}
                isStreaming={isStreaming}
                defaultOpen={false}
              />
            ) : null}
            {message.toolCalls.map((toolCall: ToolCallInfo) => {
              if (toolCall.name === "write_todos") {
                if (!visibleTodoCallIdsStr?.includes(toolCall.id)) return null;
                return <TodoCard key={toolCall.id} toolCall={toolCall} />;
              }
              return <ToolCallCard key={toolCall.id} toolCall={toolCall} />;
            })}
          </ActivitySection>
        ) : null}
      </AIPanel>
    );
  }

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      usage={message.usage}
    >
      {answerBlocks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {answerBlocks.map((block: Extract<AIBlock, { kind: "text" }>, index: number) => (
            <InlineTextContent key={`answer-${index}`} content={block.content} />
          ))}
        </div>
      ) : null}

      {hasActivity ? (
        <ActivitySection summary={activitySummary}>
          {groups.map((group: BlockGroup, groupIndex: number) => {
            if (group.kind === "subagent") {
              const isLastGroup = groupIndex === groups.length - 1;
              return (
                <SubagentGroup
                  key={`${group.agent}-${groupIndex}`}
                  group={group}
                  toolCallMap={toolCallMap}
                  isStreaming={isStreaming && isLastGroup}
                  visibleTodoCallIdsStr={visibleTodoCallIdsStr}
                  activeThinkingBlock={activeThinkingBlock}
                />
              );
            }

            return group.blocks.map((block: AIBlock, blockIndex: number) =>
              renderParentActivityBlock(block, `${groupIndex}-${blockIndex}`)
            );
          })}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
}


export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  visibleTodoCallIdsStr,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
  visibleTodoCallIdsStr?: string;
}) {
  if (message.role === "human") {
    return <HumanMessage message={message} />;
  }

  if (message.role === "ai") {
    return (
      <AIMessage
        message={message}
        isStreaming={isStreaming}
        visibleTodoCallIdsStr={visibleTodoCallIdsStr}
      />
    );
  }

  return null;
});
