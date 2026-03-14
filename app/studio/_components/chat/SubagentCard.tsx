import React from "react";
import { AIMessage } from "@langchain/core/messages";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { Bot, ChevronDown, CircleCheck, CircleDot, CircleX } from "lucide-react";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { getMessageTextContent } from "@/app/studio/_lib/message-content";

function getElapsedLabel(
  startedAt: Date | null,
  completedAt: Date | null,
): string | null {
  if (!startedAt) return null;

  const end = completedAt ?? new Date();
  const seconds = Math.max(0, Math.round((end.getTime() - startedAt.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getDisplayContent(subagent: ClassSubagentStreamInterface): string {
  if (subagent.result?.trim()) return subagent.result;

  for (let index = subagent.messages.length - 1; index >= 0; index -= 1) {
    const message = subagent.messages[index];
    if (!AIMessage.isInstance(message)) continue;

    const text = getMessageTextContent(message);
    if (text.trim()) return text;
  }

  return "";
}

const STATUS_STYLES = {
  pending: {
    icon: CircleDot,
    iconClass: "text-muted-foreground/70",
    badgeClass: "bg-muted text-muted-foreground",
  },
  running: {
    icon: CircleDot,
    iconClass: "text-success animate-pulse",
    badgeClass: "bg-success/10 text-success",
  },
  complete: {
    icon: CircleCheck,
    iconClass: "text-success",
    badgeClass: "bg-success/10 text-success",
  },
  error: {
    icon: CircleX,
    iconClass: "text-error",
    badgeClass: "bg-error/10 text-error",
  },
} as const;

export const SubagentCard = React.memo(function SubagentCard({
  subagent,
  status,
}: {
  subagent: ClassSubagentStreamInterface;
  status?: "pending" | "running" | "complete" | "error";
}) {
  const resolvedStatus = status ?? subagent.status;
  const title = typeof subagent.toolCall.args.subagent_type === "string"
    ? subagent.toolCall.args.subagent_type
    : subagent.toolCall.name;
  const description = typeof subagent.toolCall.args.description === "string"
    ? subagent.toolCall.args.description
    : "";
  const displayContent = getDisplayContent(subagent);
  const elapsed = getElapsedLabel(subagent.startedAt, subagent.completedAt);
  const style = STATUS_STYLES[resolvedStatus];
  const StatusIcon = style.icon;
  const [isOpen, setIsOpen] = React.useState(
    resolvedStatus === "running" || resolvedStatus === "error",
  );
  const visibleToolCalls = subagent.toolCalls.filter(
    (toolCall) =>
      toolCall.call.name !== "task" && toolCall.call.name !== "write_todos",
  );

  React.useEffect(() => {
    if (resolvedStatus === "running" || resolvedStatus === "error") {
      setIsOpen(true);
      return;
    }

    if (resolvedStatus === "complete") {
      setIsOpen(false);
    }
  }, [resolvedStatus]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group/subagent rounded-xl border border-border/50 bg-card/60 px-3 py-2"
    >
      <summary className="flex cursor-pointer items-start gap-3 text-left">
        <StatusIcon size={16} className={`mt-0.5 flex-shrink-0 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Bot size={13} className="text-muted-foreground/70" />
            <span className="truncate text-sm font-medium text-foreground">
              {title}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badgeClass}`}>
              {resolvedStatus}
            </span>
          </div>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 pl-2 text-[11px] text-muted-foreground">
          {elapsed ? <span>{elapsed}</span> : null}
          <ChevronDown
            size={13}
            className="flex-shrink-0 transition-transform group-open/subagent:rotate-180"
          />
        </div>
      </summary>

      {displayContent ? (
        <div className="mt-3 border-l border-border/40 pl-4 text-sm text-muted-foreground">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {displayContent}
          </p>
        </div>
      ) : null}

      {visibleToolCalls.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2 border-l border-border/40 pl-4">
          {visibleToolCalls.map((toolCall) => (
            <ToolCallCard
              key={toolCall.id}
              toolCall={toolCall}
            />
          ))}
        </div>
      ) : null}
    </details>
  );
});
