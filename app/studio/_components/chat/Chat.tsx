"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ArrowDown, History, Loader2, MessageSquarePlus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";
import type { ClassSubagentStreamInterface } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import { useThreadHistory } from "@/app/studio/_hooks/use-thread-history";
import { ASSISTANT_ID } from "@/app/studio/_lib/langgraph-config";
import { getMessageTextContent } from "@/app/studio/_lib/message-content";
import type { CadGraphState, GeomExportEntry, TodoItem } from "@/app/studio/_types/chat";

import { MessageWithSubagents } from "@/app/studio/_components/chat/MessageWithSubagents";
import type { StreamToolCall } from "@/app/studio/_components/chat/ToolCallCard";
import { TodoList } from "@/app/studio/_components/chat/TodoList";
import ThreadHistoryPanel from "@/app/studio/_components/chat/ThreadHistoryPanel";
import EmptyChatState from "@/app/studio/_components/chat/EmptyChatState";
import ChatInput, { type ChatInputHandle } from "@/app/studio/_components/chat/ChatInput";

export interface ChatProps {
  onViewerArtifact: (entry: GeomExportEntry) => void;
}

export default function Chat({ onViewerArtifact }: ChatProps) {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingHumanMessage, setPendingHumanMessage] = useState<HumanMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const isNearBottomRef = useRef(true);
  const lastHandledExportsKeyRef = useRef("");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const onViewerArtifactRef = useRef(onViewerArtifact);
  useEffect(() => {
    onViewerArtifactRef.current = onViewerArtifact;
  }, [onViewerArtifact]);

  const { client, isReady: isAuthReady } = useLanggraphAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useThreadHistory(client, isAuthReady);

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

  const streamOptions = useMemo(() => ({
    client,
    assistantId: ASSISTANT_ID,
    threadId: isAuthReady ? (urlThreadId ?? undefined) : undefined,
    fetchStateHistory: true,
    filterSubagentMessages: true,
    onThreadId: (id: string) => handleThreadIdChange(id),
  }), [
    client,
    handleThreadIdChange,
    isAuthReady,
    urlThreadId,
  ]);

  const stream = useStream<CadGraphState>(streamOptions);

  const { messages, isLoading, error, values } = stream;
  const isHydrating = stream.isThreadLoading;
  const todos: TodoItem[] = Array.isArray(values.todos) ? values.todos : [];
  const exports: GeomExportEntry[] = useMemo(
    () => Array.isArray(values.exports) ? values.exports : [],
    [values.exports],
  );
  const exportsKey = useMemo(
    () => exports.map(({ filename, url }) => `${filename}:${url}`).join("|"),
    [exports],
  );
  const isBusy = isLoading || isHydrating || !isAuthReady;

  useEffect(() => {
    lastHandledExportsKeyRef.current = "";
  }, [urlThreadId]);

  useEffect(() => {
    if (isHydrating || exports.length === 0) return;
    if (exportsKey === lastHandledExportsKeyRef.current) return;

    lastHandledExportsKeyRef.current = exportsKey;

    for (const entry of exports) {
      onViewerArtifactRef.current(entry);
    }
  }, [exports, exportsKey, isHydrating]);

  const lastHumanMessage = useMemo(
    () => [...messages].reverse().find(HumanMessage.isInstance),
    [messages],
  );
  const shouldRenderPendingHumanMessage = pendingHumanMessage != null && !(
    lastHumanMessage &&
    getMessageTextContent(lastHumanMessage) === getMessageTextContent(pendingHumanMessage)
  );
  const isEmpty = messages.length === 0 && !shouldRenderPendingHumanMessage;
  const lastMessageType = shouldRenderPendingHumanMessage
    ? "human"
    : messages[messages.length - 1]?.getType();
  const shouldShowTodoList = todos.length > 0 && lastMessageType !== "human";

  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }, [messages, isLoading, shouldRenderPendingHumanMessage]);

  const isTickingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;
    const distanceFromBottom = el.scrollHeight - currentScrollTop - el.clientHeight;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp && distanceFromBottom > 0) {
      isNearBottomRef.current = false;
      setShowScrollBtn(true);
    }

    if (isTickingRef.current) return;
    isTickingRef.current = true;
    requestAnimationFrame(() => {
      if (el) {
        const currentDistanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (!isScrollingUp) {
          isNearBottomRef.current = currentDistanceFromBottom <= 100;
        }
        setShowScrollBtn(currentDistanceFromBottom > 100);
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
    setPendingHumanMessage(new HumanMessage(trimmed));
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        streamSubgraphs: true,
        optimisticValues: (prev) => ({
          ...prev,
          todos: [],
        }),
      },
    );

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

  const handleSelectThread = useCallback((threadId: string) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    handleThreadIdChange(threadId);
  }, [handleThreadIdChange]);

  const handleDeleteThread = useCallback((threadId: string) => {
    history.deleteThread(threadId);
    if (threadId === urlThreadId) {
      handleThreadIdChange(null);
    }
  }, [history, urlThreadId, handleThreadIdChange]);

  const handleNewChat = useCallback(() => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    handleThreadIdChange(null);
  }, [handleThreadIdChange]);

  const toggleHistory = useCallback(() => {
    setHistoryOpen((v) => {
      if (!v) history.refresh();
      return !v;
    });
  }, [history]);

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

      <div className="flex shrink-0 items-center justify-end gap-1 px-4 py-2">
        <button
          onClick={handleNewChat}
          title="New chat"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquarePlus size={16} />
        </button>
        <button
          onClick={toggleHistory}
          title={historyOpen ? "Close history" : "History"}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${historyOpen
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <History size={16} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {historyOpen ? (
          <ThreadHistoryPanel
            threads={history.threads}
            isLoading={history.isLoading}
            hasMore={history.hasMore}
            activeThreadId={urlThreadId}
            onSelectThread={handleSelectThread}
            onDeleteThread={handleDeleteThread}
            onLoadMore={history.loadMore}
          />
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto scroll-on-hover px-4 pt-2 pb-6"
            >
              <div
                className={`mx-auto flex w-full max-w-4xl flex-col gap-5 ${isEmpty && !isHydrating ? "min-h-full justify-center" : ""}`}
              >
                {isEmpty && !isHydrating && (
                  <EmptyChatState
                    isHydrating={isHydrating}
                    isBusy={isBusy}
                    onExamplePrompt={handleExamplePrompt}
                  />
                )}

                {isHydrating && messages.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                  </div>
                )}

                {messages.map((message, idx) => {
                  const isAiMessage = AIMessage.isInstance(message);
                  const isLastAi =
                    isLoading &&
                    idx === messages.length - 1 &&
                    isAiMessage;
                  const toolCalls = isAiMessage &&
                    "getToolCalls" in stream &&
                    typeof stream.getToolCalls === "function"
                    ? stream.getToolCalls(message)
                    : [];
                  const subagentsByMsg = isAiMessage && message.id
                    && "getSubagentsByMessage" in stream
                    && typeof stream.getSubagentsByMessage === "function"
                    ? stream.getSubagentsByMessage(message.id)
                    : [];

                  // Fallback: match subagents by tool call ID (OpenAI message ID mismatch)
                  let subagents = subagentsByMsg;
                  if (subagents.length === 0 && isAiMessage && "subagents" in stream) {
                    const allSubagents = stream.subagents as Map<string, ClassSubagentStreamInterface>;
                    if (allSubagents instanceof Map && allSubagents.size > 0) {
                      const taskCallIds = new Set(
                        toolCalls
                          .filter((tc: StreamToolCall) => tc.call.name === "task")
                          .map((tc: StreamToolCall) => tc.call.id ?? tc.id),
                      );
                      if (taskCallIds.size > 0) {
                        subagents = [...allSubagents.values()].filter(
                          (s) => taskCallIds.has(s.id),
                        );
                      }
                    }
                  }

                  return (
                    <MessageWithSubagents
                      key={message.id ?? idx}
                      message={message}
                      isStreaming={isLastAi}
                      toolCalls={toolCalls}
                      subagents={subagents}
                    />
                  );
                })}

                {shouldRenderPendingHumanMessage && pendingHumanMessage ? (
                  <MessageWithSubagents
                    key="pending-human-message"
                    message={pendingHumanMessage}
                  />
                ) : null}

                {isLoading &&
                  lastMessageType === "human" && (
                    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}

                {shouldShowTodoList ? <TodoList todos={todos} /> : null}

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
          </>
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
