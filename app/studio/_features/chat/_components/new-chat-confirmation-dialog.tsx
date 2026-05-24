"use client";

import { useEffect } from "react";

import { cn } from "@/app/lib/cn";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { chatGlassClass } from "@/app/studio/_features/chat/_lib/chat-styles";

export type NewChatConfirmationIntent =
  | { kind: "new" }
  | { kind: "mode"; mode: StudioAssistantId };

const secondaryButtonClass =
  "inline-flex h-9 min-w-20 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const primaryButtonClass =
  "inline-flex h-9 min-w-20 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-4 text-xs font-semibold text-background transition-colors hover:bg-foreground/90";

function agentLabel(mode: StudioAssistantId) {
  if (mode === SKETCH_ASSISTANT_ID) return "Sketch Agent";
  if (mode === CAD_ASSISTANT_ID) return "CAD Agent";
  return mode;
}

export function NewChatConfirmationDialog({
  intent,
  onCancel,
  onConfirm,
}: {
  intent: NewChatConfirmationIntent;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = intent.kind === "mode"
    ? `Start a new ${agentLabel(intent.mode)} chat?`
    : "Start a new chat?";
  const description = intent.kind === "mode"
    ? `Switching to ${agentLabel(intent.mode)} will start a new chat. Saved chats stay available in History.`
    : "A new chat will be started in this panel. Saved chats stay available in History.";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/45 p-4 backdrop-blur-[2px]" role="presentation">
      <div
        className={cn(chatGlassClass, "grid w-[min(20rem,calc(100vw-2rem))] gap-4 rounded-[1rem] p-5 text-center text-foreground")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-confirmation-title"
        aria-describedby="new-chat-confirmation-description"
      >
        <div>
          <h2 id="new-chat-confirmation-title" className="text-sm font-semibold">
            {title}
          </h2>
          <p id="new-chat-confirmation-description" className="mt-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={primaryButtonClass} autoFocus>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
