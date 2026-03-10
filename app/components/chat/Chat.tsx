"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, ArrowDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useChat } from "@/app/lib/useChat";
import { isGeomExportEvent } from "./types";
import type { GeomExportEvent } from "./types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export const EXAMPLE_PROMPTS = [
  "A hollow cylinder with a threaded cap",
  "A mounting bracket with 4 screw holes",
  "A standard gear with 20 involute teeth",
  "A phone stand with an adjustable angle",
];

export interface ChatProps {
  onGeomExport: (event: GeomExportEvent) => void;
}

export default function Chat({ onGeomExport }: ChatProps) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const visibleTodoCallIds = useMemo(() => {
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
    return ids;
  }, [messages]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= 100;
    setShowScrollBtn(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isHydrating) return;

    submit(trimmed);

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    isNearBottomRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [input, isHydrating, isLoading, submit]);

  const handleExamplePrompt = useCallback((prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
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
            {messages.length === 0 && !isLoading && !isHydrating && (
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
                      onClick={() => handleExamplePrompt(prompt)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:bg-accent/5 hover:text-accent transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && isHydrating && (
              <div className="flex min-h-full items-center justify-center gap-2 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading conversation...</span>
              </div>
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
                  visibleTodoCallIds={visibleTodoCallIds}
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
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isBusy={isLoading || isHydrating}
        sendMessage={sendMessage}
        stopGeneration={stop}
        inputRef={textareaRef}
      />
    </div>
  );
}
