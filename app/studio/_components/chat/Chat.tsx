"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { HumanMessage } from "@langchain/core/messages";
import { ArrowDown, CirclePlus, History, Loader2 } from "lucide-react";

import { useThreadHistory } from "@/app/studio/_hooks/use-thread-history";
import { useChatStream } from "@/app/studio/_hooks/use-chat-stream";
import { useAssistantTimer } from "@/app/studio/_hooks/use-assistant-timer";
import { useMessageRows } from "@/app/studio/_hooks/use-message-rows";
import { getMessageTextContent } from "@/app/studio/_lib/message-content";
import { engines, DEFAULT_ENGINE } from "@/app/studio/_lib/langgraph-config";
import type { EngineKey } from "@/app/studio/_lib/langgraph-config";
import type { PartEntry } from "@/app/studio/_types/chat";
import { trackMessageSubmitted } from "@/app/lib/analytics";

import { MessageWithSubagents } from "@/app/studio/_components/chat/MessageWithSubagents";
import { TodoList } from "@/app/studio/_components/chat/TodoList";
import ThreadHistoryPanel from "@/app/studio/_components/chat/ThreadHistoryPanel";
import EmptyChatState from "@/app/studio/_components/chat/EmptyChatState";
import ChatInput, { type ChatInputHandle, type ModelConfig } from "@/app/studio/_components/chat/ChatInput";

export interface ChatProps {
  onProductEvent: (parts: PartEntry[]) => void;
  onClearViewer: () => void;
}

export default function Chat({ onProductEvent, onClearViewer }: ChatProps) {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const isGuest = !isSignedIn;
  const [selectedEngine, setSelectedEngine] = useState<EngineKey>(DEFAULT_ENGINE);

  const {
    client,
    stream,
    streamAccessors,
    messages,
    isLoading,
    isHydrating,
    isAuthReady,
    isBusy,
    error,
    todos,
    product,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } = useChatStream(selectedEngine, onProductEvent);

  const engineLocked = !!urlThreadId || messages.length > 0;

  const timer = useAssistantTimer();
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingHumanMessage, setPendingHumanMessage] = useState<HumanMessage | null>(null);
  const [draftConversationKey, setDraftConversationKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const isNearBottomRef = useRef(true);
  const isTickingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const onProductEventRef = useRef(onProductEvent);
  useEffect(() => {
    onProductEventRef.current = onProductEvent;
  }, [onProductEvent]);

  const onClearViewerRef = useRef(onClearViewer);
  useEffect(() => {
    onClearViewerRef.current = onClearViewer;
  }, [onClearViewer]);

  const history = useThreadHistory(client, isAuthReady && !isGuest);

  const conversationScope = urlThreadId ?? `draft-${draftConversationKey}`;

  const lastHumanMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (HumanMessage.isInstance(messages[i])) return messages[i];
    }
    return undefined;
  }, [messages]);
  const shouldRenderPendingHumanMessage = pendingHumanMessage != null && !(
    lastHumanMessage &&
    getMessageTextContent(lastHumanMessage) === getMessageTextContent(pendingHumanMessage)
  );
  const pendingHumanText = useMemo(
    () => pendingHumanMessage ? getMessageTextContent(pendingHumanMessage) : "",
    [pendingHumanMessage],
  );

  const { messageRows } = useMessageRows({
    messages,
    isLoading,
    conversationScope,
    shouldRenderPendingHumanMessage,
    streamAccessors,
    timer,
  });

  const isEmpty = messageRows.length === 0 && !shouldRenderPendingHumanMessage;
  const lastMessageType = shouldRenderPendingHumanMessage
    ? "human"
    : messageRows[messageRows.length - 1]?.messageType;
  const shouldShowTodoList = todos.length > 0 && lastMessageType !== "human";

  const wasHydratingRef = useRef(false);
  const prevProductRef = useRef<PartEntry[] | null>(null);

  useEffect(() => {
    if (isHydrating) {
      wasHydratingRef.current = true;
      return;
    }
    if (!wasHydratingRef.current) return;
    wasHydratingRef.current = false;
    if (product === prevProductRef.current) return;
    prevProductRef.current = product;
    onProductEventRef.current(product);
  }, [isHydrating, product]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        if (!isNearBottomRef.current) return;
        const el = messagesContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
          lastScrollTopRef.current = el.scrollTop;
        }
      });
    }
  }, [messages, isLoading, shouldRenderPendingHumanMessage]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;

    if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 1) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - currentScrollTop - el.clientHeight;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp) {
      isNearBottomRef.current = false;
    } else if (isScrollingDown) {
      isNearBottomRef.current = distanceFromBottom <= 100;
    }

    if (isTickingRef.current) return;
    isTickingRef.current = true;
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const currentEl = messagesContainerRef.current;
        setShowScrollBtn(currentEl.scrollHeight - currentEl.scrollTop - currentEl.clientHeight > 100);
      }
      isTickingRef.current = false;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback((content: string, modelConfig: ModelConfig) => {
    if (isBusy) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
      modelTier: modelConfig.modelTier,
      thinking: modelConfig.thinking,
    });
    setPendingHumanMessage(new HumanMessage(trimmed));
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        config: {
          configurable: {
            model_tier: modelConfig.modelTier,
            thinking: modelConfig.thinking,
          },
        },
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
    timer.reset();
    handleThreadIdChange(threadId);
    onClearViewerRef.current();
  }, [timer, handleThreadIdChange]);

  const handleDeleteThread = useCallback((threadId: string) => {
    history.deleteThread(threadId);
    if (threadId === urlThreadId) {
      timer.reset();
      setDraftConversationKey((key) => key + 1);
      handleThreadIdChange(null);
      onClearViewerRef.current();
    }
  }, [timer, history, urlThreadId, handleThreadIdChange]);

  const handleNewChat = useCallback(() => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    setSelectedEngine(DEFAULT_ENGINE);
    timer.reset();
    setDraftConversationKey((key) => key + 1);
    handleThreadIdChange(null);
    onClearViewerRef.current();
  }, [timer, handleThreadIdChange]);

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

      <div className="flex shrink-0 items-center justify-between gap-0 px-4 py-3">
        {engineLocked ? (
          <span className="inline-flex items-center rounded-full border border-border/40 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            {engines[selectedEngine].label}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-0">
          {!isGuest && (
            <>
              <button
                onClick={handleNewChat}
                title="New chat"
                aria-label="New chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted/70 hover:text-muted-foreground"
              >
                <CirclePlus size={18} />
              </button>
              <button
                onClick={toggleHistory}
                title={historyOpen ? "Close history" : "History"}
                aria-label={historyOpen ? "Close history" : "Open history"}
                aria-pressed={historyOpen}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${historyOpen
                  ? "bg-muted/70 text-muted-foreground"
                  : "text-muted-foreground/70 hover:bg-muted/70 hover:text-muted-foreground"
                  }`}
              >
                <History size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          Guest mode conversations can be viewed and edited by anyone with the link.{" "}
          <button
            onClick={() => clerk.openSignIn()}
            className="underline underline-offset-2 font-medium hover:text-amber-900 dark:hover:text-amber-300"
          >
            Sign in
          </button>
          {" "}for private conversations.
        </div>
      )}

      <div className="relative flex-1 min-h-0 overflow-hidden">
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
              className="h-full min-h-0 overflow-y-auto scroll-on-hover px-4 pt-2 pb-6"
            >
              <div
                className={`mx-auto flex w-full max-w-4xl flex-col gap-5 ${isEmpty && !isHydrating ? "min-h-full justify-start" : ""}`}
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

                {messageRows.map((row) => (
                  <MessageWithSubagents
                    key={row.rowKey}
                    messageType={row.messageType}
                    textContent={row.textContent}
                    thinkingContent={row.thinkingContent}
                    agentName={row.agentName}
                    usage={row.usage}
                    isStreaming={row.isStreaming}
                    startedAtMs={row.startedAtMs}
                    toolCalls={row.toolCalls}
                    subagents={row.subagents}
                    toolCallsSignature={row.toolCallsSignature}
                    subagentsSignature={row.subagentsSignature}
                    renderMarkdown={row.renderMarkdown}
                  />
                ))}

                {shouldRenderPendingHumanMessage && pendingHumanMessage ? (
                  <MessageWithSubagents
                    key="pending-human-message"
                    messageType="human"
                    textContent={pendingHumanText}
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
