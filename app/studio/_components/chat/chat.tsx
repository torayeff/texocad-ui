"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { HumanMessage } from "@langchain/core/messages";
import { ArrowDown, FileClock, Loader2, MessageSquarePlus } from "lucide-react";

import { useThreadHistory } from "@/app/studio/_hooks/use-thread-history";
import { useChatStream } from "@/app/studio/_hooks/use-chat-stream";
import { useAssistantTimer } from "@/app/studio/_hooks/use-assistant-timer";
import { useMessageRows } from "@/app/studio/_hooks/use-message-rows";
import { getMessageTextContent } from "@/app/studio/_lib/message-content";
import { DEFAULT_MODEL_ID, MODELS } from "@/app/studio/_lib/models";
import type { DesignRevisionArtifact } from "@/app/studio/_types/chat";
import { trackMessageSubmitted } from "@/app/lib/analytics";

import { MessageWithSubagents } from "@/app/studio/_components/chat/message-with-subagents";
import { TodoList } from "@/app/studio/_components/chat/todo-list";
import ThreadHistoryPanel from "@/app/studio/_components/chat/thread-history-panel";
import EmptyChatState from "@/app/studio/_components/chat/empty-chat-state";
import ChatInput, { type ChatInputHandle } from "@/app/studio/_components/chat/chat-input";
import { activeControlClass, cn, toolButtonClass, toolTooltipClass } from "@/app/studio/_components/viewer/ui/styles";

export interface ChatProps {
  onDesignRevisionEvent: (revision: DesignRevisionArtifact) => void;
  onDesignRevisionsChange: (revisions: DesignRevisionArtifact[]) => void;
  onClearViewer: () => void;
}

const chatHeaderClass =
  "relative z-20 flex h-11 shrink-0 items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-4 py-1.5 text-foreground shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

interface ChatHeaderActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  tooltip: string;
}

const chatHeaderTooltipClass = cn(
  toolTooltipClass,
  "left-auto right-0 translate-x-0 group-hover/chat-header:opacity-100 group-focus-within/chat-header:opacity-100",
);

function ChatHeaderActionButton({ children, className, tooltip, ...buttonProps }: ChatHeaderActionButtonProps) {
  return (
    <span className="group/chat-header relative inline-grid">
      <button {...buttonProps} aria-label={buttonProps["aria-label"] ?? tooltip} className={className}>
        {children}
      </button>
      <span role="tooltip" className={chatHeaderTooltipClass}>
        {tooltip}
      </span>
    </span>
  );
}

export default function Chat({ onDesignRevisionEvent, onDesignRevisionsChange, onClearViewer }: ChatProps) {
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
    designRevisions,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } = useChatStream(onDesignRevisionEvent);

  const timer = useAssistantTimer();
  const { sessionClaims } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingHumanMessage, setPendingHumanMessage] = useState<HumanMessage | null>(null);
  const [draftConversationKey, setDraftConversationKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);

  const handleModelChange = useCallback((modelId: string) => {
    if (!MODELS.some((m) => m.id === modelId)) return;
    setSelectedModel(modelId);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const isNearBottomRef = useRef(true);
  const isTickingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const onClearViewerRef = useRef(onClearViewer);
  useEffect(() => {
    onClearViewerRef.current = onClearViewer;
  }, [onClearViewer]);

  useEffect(() => {
    onDesignRevisionsChange(designRevisions);
  }, [designRevisions, onDesignRevisionsChange]);

  const history = useThreadHistory(client, isAuthReady);

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

  const sendMessage = useCallback((content: string) => {
    if (isBusy) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
    });
    setPendingHumanMessage(new HumanMessage(trimmed));
    const metadata = isVip ? { model: selectedModel } : undefined;
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        streamSubgraphs: true,
        metadata,
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
  }, [isBusy, isVip, selectedModel, stream]);

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

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className={chatHeaderClass}>
          <div className="flex min-w-0 items-center px-1">
            <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-foreground">
              TexoCAD AI
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <ChatHeaderActionButton
              type="button"
              onClick={handleNewChat}
              aria-label="New chat"
              tooltip="New chat"
              className={toolButtonClass}
            >
              <MessageSquarePlus size={14} strokeWidth={1.75} />
            </ChatHeaderActionButton>
            <ChatHeaderActionButton
              type="button"
              onClick={toggleHistory}
              aria-label={historyOpen ? "Close history" : "Open history"}
              aria-pressed={historyOpen}
              tooltip={historyOpen ? "Close history" : "History"}
              className={cn(toolButtonClass, historyOpen && activeControlClass)}
            >
              <FileClock size={14} strokeWidth={1.75} />
            </ChatHeaderActionButton>
          </div>
        </div>

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
              className="h-full min-h-0 overflow-y-auto scroll-on-hover px-4 pb-40 pt-6"
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
                className="absolute bottom-36 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] text-muted-foreground shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowDown size={16} />
              </button>
            )}
          </>
        )}
        <ChatInput
          ref={chatInputRef}
          isLoading={isLoading}
          isBusy={isBusy}
          onSubmit={sendMessage}
          stopGeneration={() => stream.stop()}
          model={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
}
