"use client";

import React, { useCallback } from "react";
import { Square, ArrowUp, Plus } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  stopGeneration: () => void;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}

export const ChatInput = React.memo(function ChatInput({
  input,
  setInput,
  isLoading,
  sendMessage,
  stopGeneration,
  inputRef,
}: ChatInputProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    },
    [setInput]
  );

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
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-0.5"
          aria-label="Add attachment"
        >
          <Plus size={18} />
        </button>

        <textarea
          ref={inputRef}
          value={input}
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
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background cursor-pointer transition-colors hover:opacity-90 mb-0.5"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            aria-label="Send message"
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors mb-0.5 ${input.trim()
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
});
