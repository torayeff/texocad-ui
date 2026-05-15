import React from "react";
import { CircleCheck, CircleDashed, CircleX, ChevronDown, Wrench } from "lucide-react";

import type { StreamToolCall } from "@/app/studio/_features/chat/_types/chat";

function getToolResultText(result: unknown): string {
  if (typeof result !== "object" || result === null || !("content" in result)) {
    return "";
  }

  const { content } = result;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .filter((block): block is { type: "text"; text: string } =>
      typeof block === "object"
      && block !== null
      && "type" in block
      && "text" in block
      && block.type === "text"
      && typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("");
}

type ToolCallState = "pending" | "completed" | "error";

const STATUS_CLASS: Record<ToolCallState, string> = {
  pending: "text-success",
  completed: "text-success",
  error: "text-error",
};

const STATUS_LABEL: Record<ToolCallState, string> = {
  pending: "Running",
  completed: "Done",
  error: "Failed",
};

export const ToolCallCard = React.memo(function ToolCallCard({
  toolCall,
  isStreaming = false,
}: {
  toolCall: StreamToolCall;
  isStreaming?: boolean;
}) {
  const state: ToolCallState = toolCall.result != null && toolCall.state === "pending"
    ? "completed"
    : toolCall.state;
  const cls = `flex-shrink-0 ${STATUS_CLASS[state]}`;
  const [isOpen, setIsOpen] = React.useState(false);
  const shouldRenderBody = isOpen || (state === "pending" && isStreaming);
  const resultText = React.useMemo(
    () => shouldRenderBody ? getToolResultText(toolCall.result) : "",
    [shouldRenderBody, toolCall.result],
  );
  const hasArgs = Object.keys(toolCall.call.args).length > 0;

  const statusIcon =
    state === "completed" ? (
      <CircleCheck size={14} className={cls} />
    ) : state === "error" ? (
      <CircleX size={14} className={cls} />
    ) : (
      <CircleDashed size={14} className={cls} />
    );

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group/tool"
    >
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Wrench size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground/85">
          {toolCall.call.name}
        </span>
        {state !== "completed" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${state === "pending" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}
          >
            {STATUS_LABEL[state]}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          {statusIcon}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/tool:rotate-180"
          />
        </div>
      </summary>

      {shouldRenderBody ? (
        <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
          {hasArgs ? (
            <section className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Input
              </p>
              <pre
                className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
              >
                {JSON.stringify(toolCall.call.args, null, 2)}
              </pre>
            </section>
          ) : null}

          {resultText.trim() ? (
            <section className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Output
              </p>
              <pre
                className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
              >
                {resultText}
              </pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </details>
  );
});
