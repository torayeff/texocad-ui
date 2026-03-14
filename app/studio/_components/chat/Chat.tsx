"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import { isGeomExportEvent } from "@/app/studio/_lib/geom-export";
import { LANGGRAPH_API_URL, ASSISTANT_ID } from "@/app/studio/_lib/langgraph-config";
import type { GeomExportEvent, CadGraphState, TodoItem } from "@/app/studio/_types/chat";

import { ChatMessage } from "@/app/studio/_components/chat/ChatMessage";
import { TodoCard } from "@/app/studio/_components/chat/TodoCard";
import EmptyChatState from "@/app/studio/_components/chat/EmptyChatState";
import ChatInput, { type ChatInputHandle } from "@/app/studio/_components/chat/ChatInput";

export interface ChatProps {
  onGeomExport: (event: GeomExportEvent) => void;
}

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

  const { headers, isReady: isAuthReady } = useLanggraphAuth();

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

  const stream = useStream<CadGraphState>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: ASSISTANT_ID,
    threadId: isAuthReady ? (urlThreadId ?? undefined) : undefined,
    defaultHeaders: headers,
    fetchStateHistory: true,
    onThreadId: (id) => handleThreadIdChange(id),
    onCustomEvent: (event) => {
      const data = event as Record<string, unknown>;
      if (isGeomExportEvent(data)) {
        onGeomExportRef.current(data);
      }
    },
  });

  const { messages, isLoading, error, values } = stream;
  const isHydrating = stream.isThreadLoading;
  const todos = "todos" in values && Array.isArray(values.todos)
    ? (values.todos as TodoItem[])
    : [];
  const isBusy = isLoading || isHydrating || !isAuthReady;
  const isEmpty = messages.length === 0;

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
    const trimmed = content.trim();
    if (!trimmed) return;
    stream.submit({ messages: [{ type: "human", content: trimmed }] });

    isNearBottomRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [isBusy, stream]);

  const handleExamplePrompt = useCallback((prompt: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.setPrompt(prompt);
      chatInputRef.current.focus();
    }
  }, []);

  const errorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null;
  const isNotFound = errorMessage?.includes("HTTP 404");

  if (isNotFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Thread not found</p>
        <button
          onClick={() => router.replace(pathname)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Start a new conversation
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {errorMessage ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-xs">
          <span>Error: {errorMessage}</span>
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
                message.getType() === "ai";

              return (
                <ChatMessage
                  key={message.id ?? idx}
                  message={message}
                  isStreaming={isLastAi}
                />
              );
            })}

            {todos.length > 0 && <TodoCard todos={todos} />}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].getType() === "human" && (
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
        stopGeneration={() => stream.stop()}
      />
    </div>
  );
}
