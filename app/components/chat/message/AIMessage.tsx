import React from "react";
import type { ChatMessage as ChatMessageType, AIBlock, ToolCallInfo } from "@/app/components/chat/types";

import { groupBlocks, findToolCall, BlockGroup } from "@/app/components/chat/groupBlocks";
import {
  resolveAgentName,
  getAnswerBlocks,
  getActivitySummary,
  getStatusLabel,
  getActiveThinkingBlock,
  hasVisibleActivity,
} from "@/app/components/chat/utils/messageUtils";

import { AIPanel, ActivitySection } from "@/app/components/chat/message/AIPanel";
import { InlineThinkingBlock, InlineTextContent } from "@/app/components/chat/blocks/TextBlocks";
import { ToolCallCard } from "@/app/components/chat/blocks/ToolCallCard";
import { TodoCard } from "@/app/components/chat/blocks/TodoCard";
import { SubagentGroup } from "@/app/components/chat/blocks/SubagentGroup";

function renderParentActivityBlock(
  block: AIBlock,
  key: string,
  toolCalls: ToolCallInfo[],
  activeThinkingBlock: Extract<AIBlock, { kind: "thinking" }> | undefined,
  visibleTodoCallIds?: Set<string>,
): React.ReactNode {
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
      const toolCall = findToolCall(toolCalls, block.toolCallId);
      if (!toolCall) return null;
      if (toolCall.name === "write_todos") {
        if (!visibleTodoCallIds?.has(toolCall.id)) return null;
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

export const AIMessage = React.memo(function AIMessage({
  message,
  isStreaming,
  visibleTodoCallIds,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
  visibleTodoCallIds?: Set<string>;
}) {
  const hasBlocks = message.blocks.length > 0;
  const hasToolCalls = message.toolCalls.length > 0;
  const hasText = message.content.trim().length > 0;

  const groups = groupBlocks(message.blocks);
  const agentName = resolveAgentName(message);
  const answerBlocks = getAnswerBlocks(message.blocks);
  const activitySummary = getActivitySummary(groups, message.toolCalls);
  const statusLabel = getStatusLabel(message, isStreaming);
  const activeThinkingBlock = getActiveThinkingBlock(message.blocks, isStreaming);
  const hasActivity = hasBlocks
    ? hasVisibleActivity(groups, message.toolCalls, visibleTodoCallIds)
    : Boolean(message.thinking) || hasToolCalls;

  if (!hasBlocks && !hasToolCalls && !hasText && !isStreaming) return null;

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
                if (!visibleTodoCallIds?.has(toolCall.id)) return null;
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
                  toolCalls={message.toolCalls}
                  isStreaming={isStreaming && isLastGroup}
                  visibleTodoCallIds={visibleTodoCallIds}
                  activeThinkingBlock={activeThinkingBlock}
                />
              );
            }

            return group.blocks.map((block: AIBlock, blockIndex: number) =>
              renderParentActivityBlock(
                block,
                `${groupIndex}-${blockIndex}`,
                message.toolCalls,
                activeThinkingBlock,
                visibleTodoCallIds,
              ),
            );
          })}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
});
