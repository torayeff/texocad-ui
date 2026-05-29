"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HumanMessage } from "@langchain/core/messages";

import { CAD_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import type { NewChatConfirmationIntent } from "@/app/studio/_features/chat/_components/new-chat-confirmation-dialog";
import type { AssistantTimer, ChatInputHandle, ThreadSummary } from "@/app/studio/_features/chat/_types/chat";

interface ChatHistoryControls {
  deleteThread: (threadId: string) => void;
  renameThread: (threadId: string, title: string) => Promise<void>;
  refresh: () => void;
}

interface UseChatSessionControllerOptions {
  assistantId: StudioAssistantId;
  chatInputRef: React.RefObject<ChatInputHandle | null>;
  history: ChatHistoryControls;
  hasInitialAgentMode: boolean;
  isHydrating: boolean;
  messageCount: number;
  onClearViewer: () => void;
  onModeChange: (mode: StudioAssistantId) => void;
  onModeReset: () => void;
  switchThread: (threadId: string | null) => void;
  timer: AssistantTimer;
  urlThreadId: string | null;
}

function focusChatInput(inputRef: React.RefObject<ChatInputHandle | null>) {
  requestAnimationFrame(() => {
    inputRef.current?.focus();
  });
}

export function useChatSessionController({
  assistantId,
  chatInputRef,
  history,
  hasInitialAgentMode,
  isHydrating,
  messageCount,
  onClearViewer,
  onModeChange,
  onModeReset,
  switchThread,
  timer,
  urlThreadId,
}: UseChatSessionControllerOptions) {
  const [pendingHumanMessageState, setPendingHumanMessageState] = useState<{
    message: HumanMessage;
    threadId: string | null;
  } | null>(null);
  const [draftConversationKey, setDraftConversationKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hasChosenMode, setHasChosenMode] = useState(urlThreadId !== null || hasInitialAgentMode);
  const [newChatConfirmationIntent, setNewChatConfirmationIntent] = useState<NewChatConfirmationIntent | null>(null);
  const onClearViewerRef = useRef(onClearViewer);

  useEffect(() => {
    onClearViewerRef.current = onClearViewer;
  }, [onClearViewer]);

  const pendingHumanMessage = pendingHumanMessageState && (
    pendingHumanMessageState.threadId === urlThreadId ||
    (pendingHumanMessageState.threadId === null && isHydrating)
  )
    ? pendingHumanMessageState.message
    : null;
  const setPendingHumanMessage = useCallback((message: HumanMessage | null) => {
    setPendingHumanMessageState(message ? { message, threadId: urlThreadId } : null);
  }, [urlThreadId]);

  const startNewChat = useCallback((mode: StudioAssistantId) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    timer.reset();
    setDraftConversationKey((key) => key + 1);
    setHasChosenMode(true);
    switchThread(null);
    onClearViewerRef.current();
    onModeChange(mode);
    focusChatInput(chatInputRef);
  }, [chatInputRef, onModeChange, setPendingHumanMessage, switchThread, timer]);

  const hasStartedChat = messageCount > 0 || pendingHumanMessage !== null || urlThreadId !== null;
  const hasActiveMode = hasChosenMode || urlThreadId !== null;

  const handleModeSelect = useCallback((mode: StudioAssistantId) => {
    if (mode === assistantId && hasActiveMode) return;
    if (!hasStartedChat) {
      onModeChange(mode);
      setHasChosenMode(true);
      focusChatInput(chatInputRef);
      return;
    }
    setNewChatConfirmationIntent({ kind: "mode", mode });
  }, [assistantId, chatInputRef, hasActiveMode, hasStartedChat, onModeChange]);

  const handleSelectThread = useCallback((thread: ThreadSummary) => {
    setHistoryOpen(false);
    setPendingHumanMessage(null);
    setHasChosenMode(true);
    timer.reset();
    if (thread.mode) onModeChange(thread.mode);
    switchThread(thread.threadId);
    onClearViewerRef.current();
  }, [onModeChange, setPendingHumanMessage, switchThread, timer]);

  const handleDeleteThread = useCallback((threadId: string) => {
    history.deleteThread(threadId);
    if (threadId === urlThreadId) {
      timer.reset();
      setDraftConversationKey((key) => key + 1);
      setHasChosenMode(false);
      onModeReset();
      switchThread(null);
      onClearViewerRef.current();
    }
  }, [history, onModeReset, switchThread, timer, urlThreadId]);

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
    setHistoryOpen((isOpen) => {
      if (!isOpen) history.refresh();
      return !isOpen;
    });
  }, [history]);

  const resetAfterNotFound = useCallback(() => {
    setPendingHumanMessage(null);
    setDraftConversationKey((key) => key + 1);
    setHasChosenMode(false);
    timer.reset();
    onModeReset();
    switchThread(null);
    onClearViewerRef.current();
  }, [onModeReset, setPendingHumanMessage, switchThread, timer]);

  return {
    conversationScope: urlThreadId ?? `draft-${draftConversationKey}`,
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
  };
}
