import React from "react";
import { CircleCheck, CircleDashed, CircleX, ChevronDown, Wrench } from "lucide-react";
import { useAutoScroll } from "@/app/studio/_hooks/use-auto-scroll";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";
import type { ToolCallInfo, ToolCallState } from "@/app/studio/_types/chat";

const TOOL_CALL_STATUS_CLASS: Record<ToolCallState, string> = {
  pending: "text-success",
  completed: "text-success",
  error: "text-error",
};

const TOOL_CALL_STATUS_LABEL: Record<ToolCallState, string> = {
  pending: "Running",
  completed: "Done",
  error: "Failed",
};

export const ToolCallCard = React.memo(function ToolCallCard({
  toolCall,
}: {
  toolCall: ToolCallInfo;
}) {
  const [inputScrollRef, handleInputScroll] = useAutoScroll<HTMLPreElement>();
  const [outputScrollRef, handleOutputScroll] = useAutoScroll<HTMLPreElement>();
  const { name, args, result, state } = toolCall;
  const cls = `flex-shrink-0 ${TOOL_CALL_STATUS_CLASS[state]}`;

  const statusIcon =
    state === "completed" ? (
      <CircleCheck size={14} className={cls} />
    ) : state === "error" ? (
      <CircleX size={14} className={cls} />
    ) : (
      <CircleDashed size={14} className={cls} />
    );

  return (
    <details className="group/tool">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Wrench size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground/85">
          {name}
        </span>
        {state !== "completed" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${state === "pending" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}
          >
            {TOOL_CALL_STATUS_LABEL[state]}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {statusIcon}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/tool:rotate-180"
          />
        </div>
      </summary>

      <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
        {args && Object.keys(args).length > 0 ? (
          <section className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Input
            </p>
            <pre
              ref={inputScrollRef}
              onScroll={handleInputScroll}
              className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </section>
        ) : null}

        {result ? (
          <section className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Output
            </p>
            <pre
              ref={outputScrollRef}
              onScroll={handleOutputScroll}
              className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
            >
              {result}
            </pre>
          </section>
        ) : null}
      </div>
    </details>
  );
});
