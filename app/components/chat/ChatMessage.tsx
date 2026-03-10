"use client";

import React from "react";

import type { ChatMessage as ChatMessageType, AIBlock, ToolCallInfo } from "./types";
import { Bot, ChevronDown, CircleCheck, Loader2 } from "lucide-react";

import {
  MessageBubble,
  ToolCallCard,
  TodoCard,
  InlineThinkingBlock,
  InlineTextContent,
  PanelTimer,
  SubagentGroup,
} from "./MessageFormatters";
import { groupBlocks, findToolCall } from "./groupBlocks";
import type { BlockGroup } from "./groupBlocks";

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  visibleTodoCallIds,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
  visibleTodoCallIds?: Set<string>;
}) {
  if (message.role === "human") {
    return <MessageBubble message={message} />;
  }

  if (message.role === "ai") {
    return (
      <AIMessage
        message={message}
        isStreaming={isStreaming}
        visibleTodoCallIds={visibleTodoCallIds}
      />
    );
  }

  return null;
});

function resolveAgentName(message: ChatMessageType): string {
  for (const b of message.blocks) {
    if (!b.isSubagent && b.agent) return b.agent;
  }
  return "";
}

function formatToolName(name: string): string {
  return name.replace(/_/g, " ");
}

function getPendingTool(toolCalls: ToolCallInfo[]): ToolCallInfo | undefined {
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].state === "pending") return toolCalls[i];
  }
  return undefined;
}

function getLatestVisibleBlock(blocks: AIBlock[]): AIBlock | undefined {
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].kind !== "tool_result") return blocks[i];
  }
  return undefined;
}

function getActivitySummary(groups: BlockGroup[], toolCalls: ToolCallInfo[]): string {
  const parts: string[] = [];
  const thinkingCount = groups.reduce(
    (count, group) =>
      count + group.blocks.filter((block) => block.kind === "thinking").length,
    0,
  );
  const subagentCount = groups.filter((group) => group.kind === "subagent").length;

  if (thinkingCount > 0) {
    parts.push(`${thinkingCount} thought${thinkingCount === 1 ? "" : "s"}`);
  }
  if (toolCalls.length > 0) {
    parts.push(`${toolCalls.length} tool${toolCalls.length === 1 ? "" : "s"}`);
  }
  if (subagentCount > 0) {
    parts.push(`${subagentCount} subagent${subagentCount === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

function getStatusLabel(message: ChatMessageType, isStreaming: boolean): string | null {
  const pendingTool = getPendingTool(message.toolCalls);
  if (pendingTool) {
    if (pendingTool.isSubagent && pendingTool.agent) {
      return `${pendingTool.agent} running ${formatToolName(pendingTool.name)}`;
    }
    return `Running ${formatToolName(pendingTool.name)}`;
  }

  const latestBlock = getLatestVisibleBlock(message.blocks);
  if (latestBlock?.kind === "thinking") {
    if (latestBlock.isSubagent && latestBlock.agent) return `${latestBlock.agent} thinking`;
    return "Thinking";
  }
  if (latestBlock?.isSubagent && latestBlock.agent && isStreaming) {
    return `${latestBlock.agent} active`;
  }
  if (isStreaming) return "Working";
  if (message.toolCalls.some((toolCall) => toolCall.state === "error")) return "Needs attention";
  return null;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function getAnswerBlocks(blocks: AIBlock[]): Extract<AIBlock, { kind: "text" }>[] {
  return blocks.filter(
    (block): block is Extract<AIBlock, { kind: "text" }> =>
      !block.isSubagent && block.kind === "text",
  );
}

function hasVisibleParentActivity(blocks: AIBlock[], toolCalls: ToolCallInfo[], visibleTodoCallIds?: Set<string>): boolean {
  return blocks.some((block) => {
    if (block.kind === "thinking") return true;
    if (block.kind !== "tool_call") return false;
    const toolCall = findToolCall(toolCalls, block.toolCallId);
    if (!toolCall) return false;
    if (toolCall.name !== "write_todos") return true;
    return visibleTodoCallIds?.has(toolCall.id) ?? false;
  });
}

function hasVisibleActivity(
  groups: BlockGroup[],
  toolCalls: ToolCallInfo[],
  visibleTodoCallIds?: Set<string>,
): boolean {
  return groups.some((group) => {
    if (group.kind === "subagent") return true;
    return hasVisibleParentActivity(group.blocks, toolCalls, visibleTodoCallIds);
  });
}

function renderParentActivityBlock(
  block: AIBlock,
  key: string,
  toolCalls: ToolCallInfo[],
  isStreaming: boolean,
  visibleTodoCallIds?: Set<string>,
): React.ReactNode {
  switch (block.kind) {
    case "thinking":
      return (
        <InlineThinkingBlock
          key={key}
          content={block.content}
          isStreaming={isStreaming}
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
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}

const AIMessage = React.memo(function AIMessage({
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
            {message.toolCalls.map((toolCall) => {
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
          {answerBlocks.map((block, index) => (
            <InlineTextContent key={`answer-${index}`} content={block.content} />
          ))}
        </div>
      ) : null}

      {hasActivity ? (
        <ActivitySection summary={activitySummary}>
          {groups.map((group, groupIndex) => {
            if (group.kind === "subagent") {
              const isLastGroup = groupIndex === groups.length - 1;
              return (
                <SubagentGroup
                  key={`${group.agent}-${groupIndex}`}
                  group={group}
                  toolCalls={message.toolCalls}
                  isStreaming={isStreaming && isLastGroup}
                  visibleTodoCallIds={visibleTodoCallIds}
                />
              );
            }

            return group.blocks.map((block, blockIndex) =>
              renderParentActivityBlock(
                block,
                `${groupIndex}-${blockIndex}`,
                message.toolCalls,
                isStreaming,
                visibleTodoCallIds,
              ),
            );
          })}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
});

function AIPanel({
  agentName,
  statusLabel,
  isStreaming,
  usage,
  children,
}: {
  agentName: string;
  statusLabel: string | null;
  isStreaming: boolean;
  usage?: ChatMessageType["usage"];
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-xs">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/70" />
        <span className="font-medium text-foreground/90">
          {agentName || "Assistant"}
        </span>
        {statusLabel ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isStreaming ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/80"}`}
          >
            {statusLabel}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2 text-muted-foreground/70">
          <PanelTimer active={isStreaming} fixedSeconds={!isStreaming ? usage?.runtimeSeconds : undefined} />
          {isStreaming ? (
            <Loader2 size={13} className="animate-spin text-success" />
          ) : (
            <CircleCheck size={13} className="text-success" />
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-3 pl-5">
        {children}
        {!isStreaming && (usage?.inputTokens || usage?.outputTokens) ? (
          <div className="text-[11px] text-muted-foreground/70">
            {formatNumber(usage?.inputTokens ?? 0)} input · {formatNumber(usage?.outputTokens ?? 0)} output tokens
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActivitySection({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary: string;
}) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <span className="font-medium text-foreground/85">Activity</span>
        {summary ? <span className="text-[11px] text-muted-foreground/70">{summary}</span> : null}
        <div className="ml-auto flex items-center gap-2">
          <ChevronDown
            size={13}
            className="text-muted-foreground/50 transition-transform group-open:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {children}
      </div>
    </details>
  );
}
