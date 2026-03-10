"use client";

import React, { useCallback } from "react";
import { Square, ArrowUp, Plus } from "lucide-react";

export interface ChatInputHandle {
  setPrompt: (text: string) => void;
  focus: () => void;
}

interface ChatInputProps {
  isBusy: boolean;
  isLoading: boolean;
  onSubmit: (text: string) => void;
  stopGeneration: () => void;
}

export const ChatInput = React.memo(React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  isBusy,
  isLoading,
  onSubmit,
  stopGeneration,
}: ChatInputProps, ref) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => ({
    setPrompt: (text: string) => {
      setInput(text);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    },
    []
  );

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    onSubmit(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isBusy, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="sticky bottom-0 z-10 p-4 bg-background">
      <div className="relative flex items-end gap-2 rounded-3xl border border-border bg-muted/20 px-2 py-2 focus-within:border-border/80 focus-within:bg-background focus-within:ring-1 focus-within:ring-border/40 transition-colors">
        <button
          type="button"
          disabled
          aria-label="Attachments coming soon"
          title="Attachments coming soon"
          className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-50"
        >
          <Plus size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          disabled={isBusy}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe a part..."
          rows={1}
          className="flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-[200px]"
          style={{ minHeight: "24px" }}
        />

        {isLoading ? (
          <button
            onClick={stopGeneration}
            aria-label="Stop generation"
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:opacity-90"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isBusy}
            aria-label="Send message"
            className={`mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${input.trim()
              ? "bg-foreground text-background hover:opacity-90"
              : "bg-muted text-muted-foreground"
              } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
}));
