import React from "react";
import { Bot, Loader2, CircleCheck } from "lucide-react";
import { PanelTimer } from "@/app/studio/_components/chat/panel-timer";
import type { MessageUsage } from "@/app/studio/_lib/message-rows";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function AIPanel({
  agentName,
  hideHeader,
  statusLabel,
  isStreaming,
  timerStartedAtMs,
  usage,
  children,
}: {
  agentName?: string;
  hideHeader?: boolean;
  statusLabel: string | null;
  isStreaming: boolean;
  timerStartedAtMs?: number;
  usage?: MessageUsage;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {!hideHeader && (
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
              startedAtMs={timerStartedAtMs}
              fixedSeconds={!isStreaming ? usage?.runtimeSeconds : undefined}
            />
            {isStreaming ? (
              <Loader2 size={13} className="animate-spin text-success" />
            ) : (
              <CircleCheck size={13} className="text-success" />
            )}
          </div>
        </div>
      )}
      <div className={hideHeader ? "mt-1 flex flex-col gap-3" : "mt-2 flex flex-col gap-3 pl-5"}>
        {children}
        {process.env.NODE_ENV === "development" && !isStreaming && (usage?.inputTokens || usage?.outputTokens) ? (
          <div className="text-[11px] text-muted-foreground/70">
            {formatNumber(usage?.inputTokens ?? 0)} input ·{" "}
            {formatNumber(usage?.outputTokens ?? 0)} output tokens
            {usage?.reasoningTokens ? ` · ${formatNumber(usage.reasoningTokens)} reasoning` : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}
