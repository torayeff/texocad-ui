import React from "react";
import Image from "next/image";
import { Bot, Loader2, CircleCheck } from "lucide-react";
import { PanelTimer } from "@/app/components/chat/panel-timer";

export function AIPanel({
  agentAvatarUrl,
  agentName,
  hideHeader,
  statusLabel,
  isStreaming,
  timerStartedAtMs,
  runtimeSeconds,
  children,
}: {
  agentAvatarUrl?: string;
  agentName?: string;
  hideHeader?: boolean;
  statusLabel: string | null;
  isStreaming: boolean;
  timerStartedAtMs?: number;
  runtimeSeconds?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex items-center gap-2 text-xs">
          {agentAvatarUrl ? (
            <Image
              src={agentAvatarUrl}
              alt=""
              width={24}
              height={24}
              className="size-6 flex-shrink-0 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <Bot size={13} className="flex-shrink-0 text-muted-foreground/70" />
          )}
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
              fixedSeconds={!isStreaming ? runtimeSeconds : undefined}
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
      </div>
    </div>
  );
}
