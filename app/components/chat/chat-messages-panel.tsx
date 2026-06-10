"use client";

import { ArrowDown, Loader2 } from "lucide-react";

import type { RefObject } from "react";
import type { HumanMessage } from "@langchain/core/messages";
import type { MessageRow } from "@/app/lib/chat/message-rows";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import type { TodoItem } from "@/app/types/chat";
import EmptyChatState from "@/app/components/chat/empty-chat-state";
import { MessageWithSubagents } from "@/app/components/chat/message-with-subagents";
import { TodoList } from "@/app/components/chat/todo-list";
import { chatContentRailClass } from "@/app/lib/chat/chat-styles";

interface ChatMessagesPanelProps {
  activeMode: AssistantId | null;
  agentAvatarUrl?: string;
  handleScroll: () => void;
  isBusy: boolean;
  isEmpty: boolean;
  isHydrating: boolean;
  isLoading: boolean;
  lastMessageType?: string;
  messageRows: MessageRow[];
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onModeSelect: (mode: AssistantId) => void;
  onPromptSelect: (prompt: string) => void;
  pendingHumanMessage: HumanMessage | null;
  pendingHumanText: string;
  scrollToBottom: () => void;
  shouldRenderPendingHumanMessage: boolean;
  shouldShowTodoList: boolean;
  showScrollButton: boolean;
  todos: TodoItem[];
}

export function ChatMessagesPanel({
  activeMode,
  agentAvatarUrl,
  handleScroll,
  isBusy,
  isEmpty,
  isHydrating,
  isLoading,
  lastMessageType,
  messageRows,
  messagesContainerRef,
  messagesEndRef,
  onModeSelect,
  onPromptSelect,
  pendingHumanMessage,
  pendingHumanText,
  scrollToBottom,
  shouldRenderPendingHumanMessage,
  shouldShowTodoList,
  showScrollButton,
  todos,
}: ChatMessagesPanelProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-on-hover px-[var(--app-chrome-gutter)] pb-6 pt-6"
      >
        <div
          className={`${chatContentRailClass} flex flex-col gap-5 ${isEmpty && !isHydrating ? "min-h-full justify-center" : ""}`}
        >
          {isEmpty && !isHydrating && (
            <EmptyChatState
              activeMode={activeMode}
              isHydrating={isHydrating}
              isBusy={isBusy}
              onModeSelect={onModeSelect}
              onPromptSelect={onPromptSelect}
            />
          )}

          {isHydrating && messageRows.length === 0 && (
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
              agentAvatarUrl={agentAvatarUrl}
              agentName={row.agentName}
              isStreaming={row.isStreaming}
              runtimeSeconds={row.runtimeSeconds}
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

          {isLoading && lastMessageType === "human" && (
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          {shouldShowTodoList ? <TodoList todos={todos} /> : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="absolute bottom-4 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] text-muted-foreground shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
}
