"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, ArrowDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useChat } from "@/app/lib/useChat";
import { isGeomExportEvent } from "@/app/components/chat/types";
export type { GeomExportEvent } from "@/app/components/chat/types";
import type { GeomExportEvent } from "@/app/components/chat/types";

export interface ChatProps {
  onGeomExport: (event: GeomExportEvent) => void;
}

import { ChatMessage } from "@/app/components/chat/ChatMessage";
import { ChatInput, type ChatInputHandle } from "@/app/components/chat/ChatInput";
import { EmptyChatState } from "@/app/components/chat/EmptyChatState";

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
        ref={chatInputRef}
        isLoading={isLoading}
        isBusy={isBusy}
        onSubmit={sendMessage}
        stopGeneration={stop}
      />
    </div>
  );
}
