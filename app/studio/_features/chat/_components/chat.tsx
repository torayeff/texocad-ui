"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { HumanMessage } from "@langchain/core/messages";

import { useThreadHistory } from "@/app/studio/_features/chat/_hooks/use-thread-history";
import { useChatStream } from "@/app/studio/_features/chat/_hooks/use-chat-stream";
import { useAssistantTimer } from "@/app/studio/_features/chat/_hooks/use-assistant-timer";
import { useMessageRows } from "@/app/studio/_features/chat/_hooks/use-message-rows";
import { useChatScroll } from "@/app/studio/_features/chat/_hooks/use-chat-scroll";
import { getMessageTextContent } from "@/app/studio/_features/chat/_lib/message-content";
import { DEFAULT_MODEL_ID, MODELS } from "@/app/studio/_features/chat/_lib/models";
import { CAD_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ChatInputHandle } from "@/app/studio/_features/chat/_types/chat";
import { trackMessageSubmitted } from "@/app/studio/_features/chat/_lib/analytics";

import { ChatHeader } from "@/app/studio/_features/chat/_components/chat-header";
import ThreadHistoryPanel from "@/app/studio/_features/chat/_components/thread-history-panel";
import ChatInput from "@/app/studio/_features/chat/_components/chat-input";
import { ChatErrorBanner, ChatNotFoundState } from "@/app/studio/_features/chat/_components/chat-error-state";
import { ChatMessagesPanel } from "@/app/studio/_features/chat/_components/chat-messages-panel";

interface ChatProps {
  assistantId: StudioAssistantId;
  onDesignRevisionEvent: (revision: DesignRevisionArtifact) => void;
  onDesignRevisionsChange: (revisions: DesignRevisionArtifact[]) => void;
  onModeChange: (mode: StudioAssistantId) => void;
  onSketchRevisionEvent: (revision: SketchRevisionArtifact) => void;
  onSketchRevisionsChange: (revisions: SketchRevisionArtifact[]) => void;
  onClearViewer: () => void;
}

export default function Chat({
  assistantId,
  onDesignRevisionEvent,
  onDesignRevisionsChange,
  onModeChange,
  onSketchRevisionEvent,
  onSketchRevisionsChange,
  onClearViewer,
}: ChatProps) {
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
    sketchRevisions,
  } = useChatStream(assistantId, {
    onDesignRevisionEvent,
    onSketchRevisionEvent,
  });

  const timer = useAssistantTimer();
  const { sessionClaims, userId } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const [pendingHumanMessage, setPendingHumanMessage] = useState<HumanMessage | null>(null);
  const [draftConversationKey, setDraftConversationKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [hasChosenMode, setHasChosenMode] = useState(urlThreadId !== null);

  const handleModelChange = useCallback((modelId: string) => {
    if (!MODELS.some((m) => m.id === modelId)) return;
    setSelectedModel(modelId);
  }, []);

  const chatInputRef = useRef<ChatInputHandle>(null);

  const onClearViewerRef = useRef(onClearViewer);
  useEffect(() => {
    onClearViewerRef.current = onClearViewer;
  }, [onClearViewer]);

  useEffect(() => {
    onDesignRevisionsChange(designRevisions);
  }, [designRevisions, onDesignRevisionsChange]);

  useEffect(() => {
    onSketchRevisionsChange(sketchRevisions);
  }, [sketchRevisions, onSketchRevisionsChange]);

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
  const {
    handleScroll,
    markNearBottom,
    messagesContainerRef,
    messagesEndRef,
    scrollToBottom,
    showScrollButton,
  } = useChatScroll({ dependencies: [messages, isLoading, shouldRenderPendingHumanMessage] });

  const sendMessage = useCallback(async (content: string) => {
    if (isBusy) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
    });
    setPendingHumanMessage(new HumanMessage(trimmed));

    const metadata = {
      ...(userId ? { owner: userId } : {}),
      ...(isVip ? { model: selectedModel } : {}),
    };
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    );

    markNearBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [isBusy, isVip, markNearBottom, scrollToBottom, selectedModel, stream, userId]);

  const handleModeSelect = useCallback((mode: StudioAssistantId) => {
    onModeChange(mode);
    setHasChosenMode(true);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  }, [onModeChange]);

  const handlePromptSelect = useCallback((prompt: string) => {
    chatInputRef.current?.setPrompt(prompt);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  }, []);

  const handleSelectThread = useCallback((threadId: string) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    setHasChosenMode(true);
    timer.reset();
    handleThreadIdChange(threadId);
    onClearViewerRef.current();
  }, [timer, handleThreadIdChange]);

  const handleDeleteThread = useCallback((threadId: string) => {
    history.deleteThread(threadId);
    if (threadId === urlThreadId) {
      timer.reset();
      setDraftConversationKey((key) => key + 1);
      setHasChosenMode(false);
      onModeChange(CAD_ASSISTANT_ID);
      handleThreadIdChange(null);
      onClearViewerRef.current();
    }
  }, [timer, history, urlThreadId, onModeChange, handleThreadIdChange]);

  const handleNewChat = useCallback(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("thread_id");
    window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
  }, []);

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
  const hasActiveMode = hasChosenMode || urlThreadId !== null;

  if (isNotFound) {
    return <ChatNotFoundState onStartNew={() => router.replace(pathname)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {errorMessage ? (
        <ChatErrorBanner message={errorMessage} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          activeMode={hasActiveMode ? assistantId : null}
          historyOpen={historyOpen}
          onModeChange={handleModeSelect}
          onNewChat={handleNewChat}
          onToggleHistory={toggleHistory}
        />

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
          <ChatMessagesPanel
            activeMode={hasActiveMode ? assistantId : null}
            handleScroll={handleScroll}
            isBusy={isBusy}
            isEmpty={isEmpty}
            isHydrating={isHydrating}
            isLoading={isLoading}
            lastMessageType={lastMessageType}
            messageRows={messageRows}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            onModeSelect={handleModeSelect}
            onPromptSelect={handlePromptSelect}
            pendingHumanMessage={pendingHumanMessage}
            pendingHumanText={pendingHumanText}
            scrollToBottom={scrollToBottom}
            shouldRenderPendingHumanMessage={shouldRenderPendingHumanMessage}
            shouldShowTodoList={shouldShowTodoList}
            showScrollButton={showScrollButton}
            todos={todos}
          />
        )}
        {historyOpen || (!hasActiveMode && isEmpty) ? null : (
          <ChatInput
            ref={chatInputRef}
            isLoading={isLoading}
            isBusy={isBusy}
            onSubmit={sendMessage}
            stopGeneration={() => stream.stop()}
            model={selectedModel}
            onModelChange={handleModelChange}
          />
        )}
      </div>
    </div>
  );
}
