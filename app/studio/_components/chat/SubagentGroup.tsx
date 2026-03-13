import React, { useMemo } from "react";
import { Bot, CircleCheck, ChevronDown, Loader2 } from "lucide-react";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";
import { InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import type { SubagentStreamInterface } from "@/app/studio/_types/chat";

function getElapsedSeconds(
  startedAt: Date | null,
  completedAt: Date | null,
): number | undefined {
  if (!startedAt) return undefined;
  const end = completedAt ?? new Date();
  return Math.round((end.getTime() - startedAt.getTime()) / 1000);
}

function getSubagentTextContent(subagent: SubagentStreamInterface): string {
  if (subagent.status === "complete" && subagent.result) {
    return subagent.result;
  }

  const lastAi = [...subagent.messages].reverse().find((m) => m.type === "ai");
  if (!lastAi) return "";
  if (typeof lastAi.content === "string") return lastAi.content;
  return lastAi.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export const SubagentCard = React.memo(function SubagentCard({
  subagent,
}: {
  subagent: SubagentStreamInterface;
}) {
  const name = subagent.toolCall?.args?.subagent_type ?? `Agent ${subagent.id.slice(0, 8)}`;
  const description = subagent.toolCall?.args?.description ?? "";
  const isActive = subagent.status === "pending" || subagent.status === "running";
  const elapsed = getElapsedSeconds(subagent.startedAt, subagent.completedAt);

  const displayContent = getSubagentTextContent(subagent);

  const nonTaskToolCalls = useMemo(
    () => subagent.toolCalls.filter((tc) => tc.call.name !== "task"),
    [subagent.toolCalls],
  );

  return (
    <details className="group/sub">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="font-medium text-foreground/85 capitalize">{name}</span>
        {description ? (
          <span className="min-w-0 truncate text-[10px] text-muted-foreground/60">
            {description}
          </span>
        ) : null}
        {isActive ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            {subagent.status === "running" ? "Active" : "Pending"}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={isActive} fixedSeconds={!isActive ? elapsed : undefined} />
          {isActive ? (
            <Loader2 size={13} className="flex-shrink-0 animate-spin text-success" />
          ) : subagent.status === "error" ? (
            <span className="text-[10px] text-error">Error</span>
          ) : (
            <CircleCheck size={14} className="flex-shrink-0 text-success" />
          )}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/sub:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {displayContent ? <InlineTextContent content={displayContent} /> : null}

        {nonTaskToolCalls.map((tc) => (
          <ToolCallCard key={tc.id} toolCall={tc} />
        ))}
      </div>
    </details>
  );
});
