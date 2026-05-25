"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { HumanMessage } from "@langchain/core/messages";

import { useThreadHistory } from "@/app/studio/_features/chat/_hooks/use-thread-history";
import { useChatStream } from "@/app/studio/_features/chat/_hooks/use-chat-stream";
import { useAssistantTimer } from "@/app/studio/_features/chat/_hooks/use-assistant-timer";
import { useChatScroll } from "@/app/studio/_features/chat/_hooks/use-chat-scroll";
import { useChatSessionController } from "@/app/studio/_features/chat/_hooks/use-chat-session-controller";
import { useInitialThreadMetadata } from "@/app/studio/_features/chat/_hooks/use-initial-thread-metadata";
import { useChatMessageView } from "@/app/studio/_features/chat/_hooks/use-chat-message-view";
import { DEFAULT_MODEL_ID, MODELS } from "@/app/studio/_features/chat/_lib/models";
import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ChatHandle, ChatInputHandle } from "@/app/studio/_features/chat/_types/chat";
import { trackMessageSubmitted } from "@/app/studio/_features/chat/_lib/analytics";
import type { SketchMaskComposerState } from "@/app/types/sketch-viewer";

import { ChatHeader } from "@/app/studio/_features/chat/_components/chat-header";
import ThreadHistoryPanel from "@/app/studio/_features/chat/_components/thread-history-panel";
import ChatInput from "@/app/studio/_features/chat/_components/chat-input";
import { ChatErrorBanner, ChatNotFoundState } from "@/app/studio/_features/chat/_components/chat-error-state";
import { ChatMessagesPanel } from "@/app/studio/_features/chat/_components/chat-messages-panel";
import { NewChatConfirmationDialog } from "@/app/studio/_features/chat/_components/new-chat-confirmation-dialog";

const GENERIC_CHAT_ERROR_MESSAGE = "Something went wrong. Please try again.";

interface ChatProps {
  assistantId: StudioAssistantId;
  initialThreadId?: string | null;
  maskComposer: SketchMaskComposerState | null;
  onDesignRevisionEvent: (revision: DesignRevisionArtifact) => void;
  onDesignRevisionsChange: (revisions: DesignRevisionArtifact[]) => void;
  onModeChange: (mode: StudioAssistantId) => void;
  onSketchRevisionEvent: (revision: SketchRevisionArtifact) => void;
  onSketchRevisionsChange: (revisions: SketchRevisionArtifact[]) => void;
  onClearViewer: () => void;
  onToggleCollapse: () => void;
}

const Chat = React.forwardRef<ChatHandle, ChatProps>(function Chat({
  assistantId,
  initialThreadId,
  maskComposer,
  onDesignRevisionEvent,
  onDesignRevisionsChange,
  onModeChange,
  onSketchRevisionEvent,
  onSketchRevisionsChange,
  onClearViewer,
  onToggleCollapse,
}: ChatProps, ref) {
  const {
    client,
    stream,
    messages,
    isLoading,
    isHydrating,
    isAuthReady,
    isBusy,
    error,
    stopGeneration,
    todos,
    designRevisions,
    urlThreadId,
    pathname,
    router,
    switchThread,
    sketchRevisions,
  } = useChatStream(assistantId, {
    initialThreadId,
    onDesignRevisionEvent,
    onSketchRevisionEvent,
  });

  const timer = useAssistantTimer();
  const { sessionClaims, userId } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);

  const handleModelChange = useCallback((modelId: string) => {
    if (!MODELS.some((m) => m.id === modelId)) return;
    setSelectedModel(modelId);
  }, []);

  const chatInputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    onDesignRevisionsChange(designRevisions);
  }, [designRevisions, onDesignRevisionsChange]);

  useEffect(() => {
    onSketchRevisionsChange(sketchRevisions);
  }, [sketchRevisions, onSketchRevisionsChange]);

  const history = useThreadHistory(client, isAuthReady);
  const initialThreadMetadata = useInitialThreadMetadata(client, isAuthReady, urlThreadId);
  const {
    conversationScope,
    handleCancelNewChat,
    handleConfirmNewChat,
    handleDeleteThread,
    handleModeSelect,
    handleNewChat,
    handleSelectThread,
    hasActiveMode,
    historyOpen,
    newChatConfirmationIntent,
    pendingHumanMessage,
    resetAfterNotFound,
    setHasChosenMode,
    setPendingHumanMessage,
    toggleHistory,
  } = useChatSessionController({
    assistantId,
    chatInputRef,
    history,
    isHydrating,
    messageCount: messages.length,
    onClearViewer,
    onModeChange,
    switchThread,
    timer,
    urlThreadId,
  });

  const {
    isEmpty,
    lastMessageType,
    messageRows,
    pendingHumanText,
    shouldRenderPendingHumanMessage,
    shouldShowTodoList,
  } = useChatMessageView({
    conversationScope,
    isLoading,
    messages,
    pendingHumanMessage,
    stream,
    timer,
    todos,
  });
  const {
    handleScroll,
    markNearBottom,
    messagesContainerRef,
    messagesEndRef,
    scrollToBottom,
    showScrollButton,
  } = useChatScroll({ dependencies: [messages, isLoading, shouldRenderPendingHumanMessage] });

  const sendMessage = useCallback((content: string) => {
    if (isBusy) return false;
    const trimmed = content.trim();
    if (!trimmed) return false;
    const humanMessage = new HumanMessage(trimmed);
    setHasChosenMode(true);
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
    });
    setPendingHumanMessage(humanMessage);
    const threadMetadata = initialThreadMetadata(trimmed, assistantId, urlThreadId);

    const metadata = {
      ...threadMetadata,
      ...(userId ? { owner: userId } : {}),
      ...(isVip ? { model: selectedModel } : {}),
    };
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        optimisticValues: (prev: Record<string, unknown>) => ({
          ...prev,
          messages: [...(Array.isArray(prev.messages) ? prev.messages : []), humanMessage],
        }),
        onDisconnect: "continue",
        streamSubgraphs: true,
        streamResumable: true,
        config: { recursion_limit: 10000 },
      },
    );

    markNearBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    return true;
  }, [
    assistantId,
    initialThreadMetadata,
    isBusy,
    isVip,
    markNearBottom,
    scrollToBottom,
    selectedModel,
    setHasChosenMode,
    setPendingHumanMessage,
    stream,
    userId,
    urlThreadId,
  ]);

  React.useImperativeHandle(ref, () => ({
    focusInput: () => {
      chatInputRef.current?.focus();
    },
    submitMessage: (content: string) => sendMessage(content),
  }), [sendMessage]);

  const handlePromptSelect = useCallback((prompt: string) => {
    chatInputRef.current?.setPrompt(prompt);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  }, []);

  const handleStartAfterNotFound = useCallback(() => {
    resetAfterNotFound();
    router.replace(pathname);
  }, [pathname, resetAfterNotFound, router]);

  const rawErrorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null;
  const isNotFound = rawErrorMessage?.includes("HTTP 404");

  if (isNotFound) {
    return <ChatNotFoundState onStartNew={handleStartAfterNotFound} />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {rawErrorMessage ? (
        <ChatErrorBanner message={GENERIC_CHAT_ERROR_MESSAGE} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          activeMode={hasActiveMode ? assistantId : null}
          historyOpen={historyOpen}
          onModeChange={handleModeSelect}
          onNewChat={handleNewChat}
          onToggleHistory={toggleHistory}
          onToggleCollapse={onToggleCollapse}
        />

        {historyOpen ? (
          <ThreadHistoryPanel
            threads={history.threads}
            isLoading={history.isLoading}
            hasMore={history.hasMore}
            activeThreadId={urlThreadId}
            onSelectThread={handleSelectThread}
            onDeleteThread={handleDeleteThread}
            onRenameThread={history.renameThread}
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
            maskComposer={maskComposer}
            onSubmit={sendMessage}
            stopGeneration={stopGeneration}
            model={selectedModel}
            onModelChange={handleModelChange}
          />
        )}
        {newChatConfirmationIntent ? (
          <NewChatConfirmationDialog
            intent={newChatConfirmationIntent}
            onCancel={handleCancelNewChat}
            onConfirm={handleConfirmNewChat}
          />
        ) : null}
      </div>
    </div>
  );
});
export default Chat;
