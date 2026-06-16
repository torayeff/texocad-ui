"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/app/lib/cn";
import { agentLabelForMode } from "@/app/lib/chat/agent-config";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import { chatGlassClass } from "@/app/lib/chat/chat-styles";
import type { NewChatConfirmationIntent } from "@/app/types/chat";

const secondaryButtonClass =
  "inline-flex h-9 min-w-20 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const primaryButtonClass =
  "inline-flex h-9 min-w-20 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-4 text-xs font-semibold text-background transition-colors hover:bg-foreground/90";
const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function agentLabel(mode: AssistantId) {
  return agentLabelForMode(mode);
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const title = intent.kind === "mode"
    ? `Start a new ${agentLabel(intent.mode)} chat?`
    : "Start a new chat?";
  const description = intent.kind === "mode"
    ? `Switching to ${agentLabel(intent.mode)} will start a new chat. Saved chats stay available in History.`
    : "A new chat will be started in this panel. Saved chats stay available in History.";

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/45 p-4 backdrop-blur-[2px]" role="presentation">
      <div
        ref={dialogRef}
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
