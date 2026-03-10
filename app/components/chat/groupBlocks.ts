import type { AIBlock, ToolCallInfo } from "./types";

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

export function findToolCall(
  toolCalls: ToolCallInfo[],
  toolCallId: string,
): ToolCallInfo | undefined {
  return toolCalls.find((tc) => tc.id === toolCallId);
}
