import React from "react";
import { Bot, Loader2, CircleCheck, ChevronDown } from "lucide-react";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";

interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  runtimeSeconds?: number;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function AIPanel({
  agentName,
  statusLabel,
  isStreaming,
  usage,
  children,
}: {
  agentName: string;
  statusLabel: string | null;
  isStreaming: boolean;
  usage?: UsageInfo;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-xs">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/70" />
        <span className="font-medium text-foreground/90">{agentName || "Assistant"}</span>
        {statusLabel ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isStreaming ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/80"
              }`}
          >
            {statusLabel}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2 text-muted-foreground/70">
          <PanelTimer
            active={isStreaming}
            fixedSeconds={!isStreaming ? usage?.runtimeSeconds : undefined}
          />
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
            {formatNumber(usage?.inputTokens ?? 0)} input ·{" "}
            {formatNumber(usage?.outputTokens ?? 0)} output tokens
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ActivitySection({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary: string;
}) {
  return (
    <details className="group/activity">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <span className="font-medium text-foreground/85">Activity</span>
        {summary ? <span className="text-[11px] text-muted-foreground/70">{summary}</span> : null}
        <div className="ml-auto flex items-center gap-2">
          <ChevronDown
            size={13}
            className="text-muted-foreground/50 transition-transform group-open/activity:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {children}
      </div>
    </details>
  );
}
