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
import type { SubagentView } from "@/app/studio/_features/chat/_lib/message-rows";
import { DEFAULT_MODEL_ID, MODELS } from "@/app/studio/_features/chat/_lib/models";
import { CAD_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { THREAD_MODE_METADATA_KEY } from "@/app/studio/_features/chat/_lib/thread-mode";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ChatHandle, ChatInputHandle, ThreadSummary } from "@/app/studio/_features/chat/_types/chat";
import type { StreamToolCall } from "@/app/studio/_features/chat/_types/chat";
import { trackMessageSubmitted } from "@/app/studio/_features/chat/_lib/analytics";
import type { SketchMaskComposerState } from "@/app/types/sketch-viewer";

import { ChatHeader } from "@/app/studio/_features/chat/_components/chat-header";
import ThreadHistoryPanel from "@/app/studio/_features/chat/_components/thread-history-panel";
import ChatInput from "@/app/studio/_features/chat/_components/chat-input";
import { ChatErrorBanner, ChatNotFoundState } from "@/app/studio/_features/chat/_components/chat-error-state";
import { ChatMessagesPanel } from "@/app/studio/_features/chat/_components/chat-messages-panel";
import {
  NewChatConfirmationDialog,
  type NewChatConfirmationIntent,
} from "@/app/studio/_features/chat/_components/new-chat-confirmation-dialog";

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

interface StreamSubagent {
  id: string;
  status: SubagentView["status"];
  toolCall: SubagentView["toolCall"];
  messages: SubagentView["messages"];
  result?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  toolCalls: StreamToolCall[];
}

interface StreamRowMethods {
  getToolCalls: (message: Parameters<typeof getMessageTextContent>[0]) => StreamToolCall[];
  getSubagentsByMessage: (messageId: string) => StreamSubagent[];
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
  const resetTimer = timer.reset;
  const { sessionClaims, userId } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const [pendingHumanMessage, setPendingHumanMessage] = useState<HumanMessage | null>(null);
  const [draftConversationKey, setDraftConversationKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [hasChosenMode, setHasChosenMode] = useState(urlThreadId !== null);
  const [newChatConfirmationIntent, setNewChatConfirmationIntent] = useState<NewChatConfirmationIntent | null>(null);

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
    setPendingHumanMessage(null);
    resetTimer();
  }, [resetTimer, urlThreadId]);

  useEffect(() => {
    onDesignRevisionsChange(designRevisions);
  }, [designRevisions, onDesignRevisionsChange]);

  useEffect(() => {
    onSketchRevisionsChange(sketchRevisions);
  }, [sketchRevisions, onSketchRevisionsChange]);

  const history = useThreadHistory(client, isAuthReady);

  const conversationScope = urlThreadId ?? `draft-${draftConversationKey}`;
  const streamRowMethods = stream as unknown as StreamRowMethods;
  const rowStreamAccessors = useMemo(() => ({
    getToolCalls: (message: Parameters<typeof getMessageTextContent>[0]) => streamRowMethods.getToolCalls(message),
    getSubagentsByMessage: (messageId: string): SubagentView[] => streamRowMethods.getSubagentsByMessage(messageId).map((subagent) => ({
      id: subagent.id,
      status: subagent.status,
      toolCall: {
        id: subagent.toolCall.id,
        name: subagent.toolCall.name,
        args: subagent.toolCall.args,
      },
      messages: subagent.messages,
      result: subagent.result,
      startedAt: subagent.startedAt,
      completedAt: subagent.completedAt,
      toolCalls: subagent.toolCalls,
    })),
  }), [streamRowMethods]);

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
    stream: rowStreamAccessors,
    timer,
  });

  const isEmpty = messageRows.length === 0 && !shouldRenderPendingHumanMessage;
  const hasActiveMode = hasChosenMode || urlThreadId !== null;
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

  const sendMessage = useCallback((content: string) => {
    if (isBusy) return false;
    const trimmed = content.trim();
    if (!trimmed) return false;
    setHasChosenMode(true);
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
    });
    setPendingHumanMessage(new HumanMessage(trimmed));

    const metadata = {
      [THREAD_MODE_METADATA_KEY]: assistantId,
      ...(userId ? { owner: userId } : {}),
      ...(isVip ? { model: selectedModel } : {}),
    };
    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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
  }, [assistantId, isBusy, isVip, markNearBottom, scrollToBottom, selectedModel, stream, userId]);

  React.useImperativeHandle(ref, () => ({
    focusInput: () => {
      chatInputRef.current?.focus();
    },
    submitMessage: (content: string) => sendMessage(content),
  }), [sendMessage]);

  const startNewChat = useCallback((mode: StudioAssistantId) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    timer.reset();
    setDraftConversationKey((key) => key + 1);
    setHasChosenMode(true);
    switchThread(null);
    onClearViewerRef.current();
    onModeChange(mode);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  }, [timer, onModeChange, switchThread]);

  const hasStartedChat = !isEmpty || urlThreadId !== null;

  const handleModeSelect = useCallback((mode: StudioAssistantId) => {
    if (mode === assistantId && hasActiveMode) return;
    if (!hasStartedChat) {
      onModeChange(mode);
      setHasChosenMode(true);
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
      return;
    }
    setNewChatConfirmationIntent({ kind: "mode", mode });
  }, [assistantId, hasActiveMode, hasStartedChat, onModeChange]);

  const handlePromptSelect = useCallback((prompt: string) => {
    chatInputRef.current?.setPrompt(prompt);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  }, []);

  const handleSelectThread = useCallback((thread: ThreadSummary) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    setHasChosenMode(true);
    timer.reset();
    if (thread.mode) onModeChange(thread.mode);
    switchThread(thread.threadId);
    onClearViewerRef.current();
  }, [timer, switchThread, onModeChange]);

  const handleDeleteThread = useCallback((threadId: string) => {
    history.deleteThread(threadId);
    if (threadId === urlThreadId) {
      timer.reset();
      setDraftConversationKey((key) => key + 1);
      setHasChosenMode(false);
      onModeChange(CAD_ASSISTANT_ID);
      switchThread(null);
      onClearViewerRef.current();
    }
  }, [timer, history, urlThreadId, onModeChange, switchThread]);

  const handleNewChat = useCallback(() => {
    if (!hasStartedChat) {
      startNewChat(hasActiveMode ? assistantId : CAD_ASSISTANT_ID);
      return;
    }
    setNewChatConfirmationIntent({ kind: "new" });
  }, [assistantId, hasActiveMode, hasStartedChat, startNewChat]);

  const handleConfirmNewChat = useCallback(() => {
    const intent = newChatConfirmationIntent;
    setNewChatConfirmationIntent(null);
    startNewChat(intent?.kind === "mode" ? intent.mode : (hasActiveMode ? assistantId : CAD_ASSISTANT_ID));
  }, [assistantId, hasActiveMode, newChatConfirmationIntent, startNewChat]);

  const handleCancelNewChat = useCallback(() => {
    setNewChatConfirmationIntent(null);
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
            stopGeneration={() => {
              void stream.stop();
            }}
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
