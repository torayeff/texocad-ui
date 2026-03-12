import type { ChatMessage as ChatMessageType, AIBlock, ToolCallInfo } from "@/app/studio/_types/chat";

export type BlockGroup =
  | { kind: "parent"; blocks: AIBlock[] }
  | { kind: "subagent"; agent: string; blocks: AIBlock[] };

export function groupBlocks(blocks: AIBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  for (const block of blocks) {
    if (block.isSubagent) {
      const last = groups[groups.length - 1];
      if (last && last.kind === "subagent" && last.agent === block.agent) {
        last.blocks.push(block);
      } else {
        groups.push({ kind: "subagent", agent: block.agent, blocks: [block] });
      }
    } else {
      const last = groups[groups.length - 1];
      if (last && last.kind === "parent") {
        last.blocks.push(block);
      } else {
        groups.push({ kind: "parent", blocks: [block] });
      }
    }
  }
  return groups;
}


export function resolveAgentName(message: ChatMessageType): string {
  for (const block of message.blocks) {
    if (!block.isSubagent && block.agent) return block.agent;
  }
  return "";
}

export function formatToolName(name: string): string {
  return name.replace(/_/g, " ");
}

export function getPendingTool(toolCalls: ToolCallInfo[]): ToolCallInfo | undefined {
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].state === "pending") return toolCalls[i];
  }
  return undefined;
}

export function getLatestVisibleBlock(blocks: AIBlock[]): AIBlock | undefined {
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].kind !== "tool_result") return blocks[i];
  }
  return undefined;
}

export function getActiveThinkingBlock(
  blocks: AIBlock[],
  isStreaming: boolean,
): Extract<AIBlock, { kind: "thinking" }> | undefined {
  if (!isStreaming) return undefined;

  const latestBlock = getLatestVisibleBlock(blocks);
  if (latestBlock?.kind !== "thinking") return undefined;
  return latestBlock;
}

export function getActivitySummary(groups: BlockGroup[], toolCalls: ToolCallInfo[]): string {
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

export function getStatusLabel(message: ChatMessageType, isStreaming: boolean): string | null {
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

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function getAnswerBlocks(blocks: AIBlock[]): Extract<AIBlock, { kind: "text" }>[] {
  return blocks.filter(
    (block): block is Extract<AIBlock, { kind: "text" }> =>
      !block.isSubagent && block.kind === "text",
  );
}

export function hasVisibleParentActivity(
  blocks: AIBlock[],
  toolCallMap: Map<string, ToolCallInfo>,
  visibleTodoCallIdsStr?: string,
): boolean {
  return blocks.some((block) => {
    if (block.kind === "thinking") return true;
    if (block.kind !== "tool_call") return false;
    const toolCall = toolCallMap.get(block.toolCallId);
    if (!toolCall) return false;
    if (toolCall.name !== "write_todos") return true;
    return visibleTodoCallIdsStr?.includes(toolCall.id) ?? false;
  });
}

export function hasVisibleActivity(
  groups: BlockGroup[],
  toolCallMap: Map<string, ToolCallInfo>,
  visibleTodoCallIdsStr?: string,
): boolean {
  return groups.some((group) => {
    if (group.kind === "subagent") return true;
    return hasVisibleParentActivity(group.blocks, toolCallMap, visibleTodoCallIdsStr);
  });
}
