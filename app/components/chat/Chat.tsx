"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, ArrowDown, Loader2, Square, ArrowUp, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useChat, isGeomExportEvent } from "@/app/lib/useChat";
import type { GeomExportEvent } from "@/app/lib/useChat";

export type { GeomExportEvent };

export interface ChatProps {
  onGeomExport: (event: GeomExportEvent) => void;
}

import { ChatMessage } from "@/app/components/chat/ChatMessage";


const EXAMPLE_PROMPTS = [
  "A hollow cylinder with a threaded cap",
  "A mounting bracket with 4 screw holes",
  "A standard gear with 20 involute teeth",
  "A phone stand with an adjustable angle",
];

function EmptyChatState({
  isHydrating,
  isBusy,
  onExamplePrompt,
}: {
  isHydrating: boolean;
  isBusy: boolean;
  onExamplePrompt: (prompt: string) => void;
}) {
  if (isHydrating) {
    return (
      <div className="flex min-h-full items-center justify-center gap-2 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading conversation...</span>
      </div>
    );
  }

  if (isBusy) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center text-muted-foreground">
      <MessageSquare size={34} className="opacity-30" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground/90">
          Enter a prompt to generate a 3D model
        </p>
        <p className="text-xs text-muted-foreground">
          Start simple, then refine with follow-up prompts.
        </p>
      </div>
      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onExamplePrompt(prompt)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:bg-accent/5 hover:text-accent transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}


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

const ChatInput = React.memo(React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
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


export default function Chat({ onGeomExport }: ChatProps) {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const isNearBottomRef = useRef(true);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const onGeomExportRef = useRef(onGeomExport);
  useEffect(() => {
    onGeomExportRef.current = onGeomExport;
  }, [onGeomExport]);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextThreadId) {
        params.set("thread_id", nextThreadId);
      } else {
        params.delete("thread_id");
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const { messages, isHydrating, isLoading, error, submit, stop } = useChat({
    threadId: urlThreadId,
    onThreadIdChange: handleThreadIdChange,
    onCustomEvent: (data) => {
      if (isGeomExportEvent(data)) {
        onGeomExportRef.current(data);
      }
    },
  });
  const isBusy = isLoading || isHydrating;
  const isEmpty = messages.length === 0;

  const visibleTodoCallIdsStr = useMemo(() => {
    const ids = new Set<string>();
    let lastTodoId: string | undefined;
    for (const m of messages) {
      if (m.role === "human") {
        if (lastTodoId) ids.add(lastTodoId);
        lastTodoId = undefined;
        continue;
      }
      if (m.role !== "ai") continue;
      for (const tc of m.toolCalls) {
        if (tc.name === "write_todos") lastTodoId = tc.id;
      }
    }
    if (lastTodoId) ids.add(lastTodoId);
    return Array.from(ids).sort().join(",");
  }, [messages]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }, [messages, isLoading]);

  const isTickingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (isTickingRef.current) return;
    isTickingRef.current = true;
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = distanceFromBottom <= 100;
        setShowScrollBtn(distanceFromBottom > 100);
      }
      isTickingRef.current = false;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (isBusy) return;
    submit(content);

    isNearBottomRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [isBusy, submit]);

  const handleExamplePrompt = useCallback((prompt: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.setPrompt(prompt);
      chatInputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      {error ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-xs">
          <span>Error: {error}</span>
        </div>
      ) : null}

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scroll-on-hover px-4 py-6"
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            {isEmpty && (
              <EmptyChatState
                isHydrating={isHydrating}
                isBusy={isBusy}
                onExamplePrompt={handleExamplePrompt}
              />
            )}

            {messages.map((message, idx) => {
              const isLastAi =
                isLoading &&
                idx === messages.length - 1 &&
                message.role === "ai";

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isLastAi}
                  visibleTodoCallIdsStr={visibleTodoCallIdsStr}
                />
              );
            })}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "human" && (
                <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md hover:bg-accent/90 transition-opacity"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>

      <ChatInput
        ref={chatInputRef}
        isLoading={isLoading}
        isBusy={isBusy}
        onSubmit={sendMessage}
        stopGeneration={stop}
      />
    </div>
  );
}
