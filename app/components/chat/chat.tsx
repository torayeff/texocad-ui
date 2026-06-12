"use client";

import React, { useRef, useEffect, useCallback } from "react";

import { useThreadHistory } from "@/app/hooks/chat/use-thread-history";
import { useChatStream } from "@/app/hooks/chat/use-chat-stream";
import { useAssistantTimer } from "@/app/hooks/chat/use-assistant-timer";
import { useChatScroll } from "@/app/hooks/chat/use-chat-scroll";
import { useChatSessionController } from "@/app/hooks/chat/use-chat-session-controller";
import { useChatMessageView } from "@/app/hooks/chat/use-chat-message-view";
import { useChatMessageSubmission } from "@/app/hooks/chat/use-chat-message-submission";
import { assistantDisplayName, type AssistantId } from "@/app/lib/chat/langgraph-config";
import type {
  DesignRevisionArtifact,
  MarkdownRevisionArtifact,
  ModelRevisionArtifact,
  SketchRevisionArtifact,
} from "@/app/types/design-artifact";
import type { ChatHandle, ChatInputHandle } from "@/app/types/chat";
import type { SketchMaskComposerState } from "@/app/types/sketch-viewer";

import { ChatHeader } from "@/app/components/chat/chat-header";
import ThreadHistoryPanel from "@/app/components/chat/thread-history-panel";
import ChatInput from "@/app/components/chat/chat-input";
import { ChatErrorBanner, ChatNotFoundState } from "@/app/components/chat/chat-error-state";
import { ChatMessagesPanel } from "@/app/components/chat/chat-messages-panel";
import { NewChatConfirmationDialog } from "@/app/components/chat/new-chat-confirmation-dialog";

const GENERIC_CHAT_ERROR_MESSAGE = "Something went wrong. Please try again.";

interface ChatProps {
  agentAvatarUrl?: string;
  assistantId: AssistantId;
  hasInitialAgentMode: boolean;
  initialThreadId?: string | null;
  maskComposer: SketchMaskComposerState | null;
  onDesignRevisionEvent: (revision: DesignRevisionArtifact) => void;
  onDesignRevisionsChange: (revisions: DesignRevisionArtifact[]) => void;
  onMarkdownRevisionEvent: (revision: MarkdownRevisionArtifact) => void;
  onMarkdownRevisionsChange: (revisions: MarkdownRevisionArtifact[]) => void;
  onModeChange: (mode: AssistantId) => void;
  onModeReset: () => void;
  onModelRevisionEvent?: (revision: ModelRevisionArtifact) => void;
  onModelRevisionsChange?: (revisions: ModelRevisionArtifact[]) => void;
  onSketchRevisionEvent: (revision: SketchRevisionArtifact) => void;
  onSketchRevisionsChange: (revisions: SketchRevisionArtifact[]) => void;
  onClearViewer: () => void;
  onToggleCollapse: () => void;
}

const Chat = React.forwardRef<ChatHandle, ChatProps>(function Chat({
  agentAvatarUrl,
  assistantId,
  hasInitialAgentMode,
  initialThreadId,
  maskComposer,
  onDesignRevisionEvent,
  onDesignRevisionsChange,
  onMarkdownRevisionEvent,
  onMarkdownRevisionsChange,
  onModeChange,
  onModeReset,
  onModelRevisionEvent,
  onModelRevisionsChange,
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
    modelRevisions,
    markdownRevisions,
  } = useChatStream(assistantId, {
    initialThreadId,
    onDesignRevisionEvent,
    onMarkdownRevisionEvent,
    onModelRevisionEvent,
    onSketchRevisionEvent,
  });

  const timer = useAssistantTimer();
  const chatInputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    onDesignRevisionsChange(designRevisions);
  }, [designRevisions, onDesignRevisionsChange]);

  useEffect(() => {
    onSketchRevisionsChange(sketchRevisions);
  }, [sketchRevisions, onSketchRevisionsChange]);

  useEffect(() => {
    onModelRevisionsChange?.(modelRevisions);
  }, [modelRevisions, onModelRevisionsChange]);

  useEffect(() => {
    onMarkdownRevisionsChange(markdownRevisions);
  }, [markdownRevisions, onMarkdownRevisionsChange]);

  const history = useThreadHistory(client, isAuthReady);
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
    hasInitialAgentMode,
    onClearViewer,
    onModeChange,
    onModeReset,
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
    defaultAgentName: assistantDisplayName(assistantId),
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

  const {
    handleModelChange,
    handleReasoningEffortChange,
    lockedReasoningEfforts,
    reasoningEfforts,
    reasoningUpsell,
    selectedModel,
    selectedReasoningEffort,
    sendMessage,
  } = useChatMessageSubmission({
    assistantId,
    client,
    isAuthReady,
    isBusy,
    markNearBottom,
    scrollToBottom,
    setHasChosenMode,
    setPendingHumanMessage,
    stream,
    urlThreadId,
  });

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
            agentAvatarUrl={agentAvatarUrl}
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
            reasoningEffort={selectedReasoningEffort}
            reasoningEfforts={reasoningEfforts}
            onReasoningEffortChange={handleReasoningEffortChange}
            lockedReasoningEfforts={lockedReasoningEfforts}
            reasoningUpsell={reasoningUpsell}
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
