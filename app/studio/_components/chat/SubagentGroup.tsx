import React from "react";
import { Bot, CircleCheck, ChevronDown } from "lucide-react";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { TodoCard } from "@/app/studio/_components/chat/TodoCard";
import type { AIBlock, ToolCallInfo } from "@/app/studio/_types/chat";
import type { BlockGroup } from "@/app/studio/_lib/chat-utils";

export const SubagentGroup = React.memo(function SubagentGroup({
  group,
  toolCallMap,
  isStreaming = false,
  visibleTodoCallIdsStr,
  activeThinkingBlock,
}: {
  group: BlockGroup & { kind: "subagent" };
  toolCallMap: Map<string, ToolCallInfo>;
  isStreaming?: boolean;
  visibleTodoCallIdsStr?: string;
  activeThinkingBlock?: Extract<AIBlock, { kind: "thinking" }>;
}) {
  const allDone = group.blocks.every((block) => {
    if (block.kind === "tool_call" || block.kind === "tool_result") {
      const tc = toolCallMap.get(block.toolCallId);
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
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/sub:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {group.blocks.map((block, i) => {
          switch (block.kind) {
            case "thinking": {
              const isActiveThinkingBlock = isStreaming && activeThinkingBlock === block;
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
              const tc = toolCallMap.get(block.toolCallId);
              if (!tc) return null;
              if (tc.name === "write_todos") {
                if (!visibleTodoCallIdsStr?.includes(tc.id)) return null;
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
