import React from "react";
import { Bot, CircleCheck, ChevronDown } from "lucide-react";

import type { AIBlock, ToolCallInfo } from "@/app/components/chat/types";
import { BlockGroup, findToolCall } from "@/app/components/chat/groupBlocks";
import { PanelTimer } from "@/app/components/chat/ui/PanelTimer";

import { InlineThinkingBlock, InlineTextContent } from "@/app/components/chat/blocks/TextBlocks";
import { ToolCallCard } from "@/app/components/chat/blocks/ToolCallCard";
import { TodoCard } from "@/app/components/chat/blocks/TodoCard";

export const SubagentGroup = React.memo(function SubagentGroup({
  group,
  toolCalls,
  isStreaming = false,
  visibleTodoCallIds,
  activeThinkingBlock,
}: {
  group: BlockGroup & { kind: "subagent" };
  toolCalls: ToolCallInfo[];
  isStreaming?: boolean;
  visibleTodoCallIds?: Set<string>;
  activeThinkingBlock?: Extract<AIBlock, { kind: "thinking" }>;
}) {
  const allDone = group.blocks.every((b) => {
    if (b.kind === "tool_call" || b.kind === "tool_result") {
      const tc = findToolCall(toolCalls, b.toolCallId);
      return tc?.state === "completed";
    }
    return true;
  });
  const active = isStreaming || !allDone;

  return (
    <details className="group/sub">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="font-medium text-foreground/85">{group.agent}</span>
        {active ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            Active
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={active} />
          {!active && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
          <ChevronDown size={13} className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/sub:rotate-180" />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {group.blocks.map((block, i) => {
          switch (block.kind) {
            case "thinking": {
              const isActiveThinkingBlock =
                isStreaming && activeThinkingBlock === block;
              return (
                <InlineThinkingBlock
                  key={i}
                  content={block.content}
                  isStreaming={isActiveThinkingBlock}
                  defaultOpen={false}
                />
              );
            }
            case "text":
              return <InlineTextContent key={i} content={block.content} />;
            case "tool_call":
            case "tool_result": {
              if (block.kind === "tool_result") return null;
              const tc = findToolCall(toolCalls, block.toolCallId);
              if (!tc) return null;
              if (tc.name === "write_todos") {
                if (!visibleTodoCallIds?.has(tc.id)) return null;
                return <TodoCard key={tc.id} toolCall={tc} />;
              }
              return <ToolCallCard key={tc.id} toolCall={tc} />;
            }
            default: {
              const exhaustiveCheck: never = block;
              return exhaustiveCheck;
            }
          }
        })}
      </div>
    </details>
  );
});
