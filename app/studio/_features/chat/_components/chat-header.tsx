import React from "react";
import { FileClock, MessageSquarePlus } from "lucide-react";

import { cn } from "@/app/lib/cn";
import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { AgentModePicker } from "@/app/studio/_features/chat/_components/agent-mode-picker";
import {
  activeControlClass,
  chatHeaderClass,
  chatHeaderTooltipClass,
  toolButtonClass,
} from "@/app/studio/_features/chat/_lib/chat-styles";

interface ChatHeaderActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  tooltip: string;
}

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

interface ChatHeaderProps {
  activeMode: StudioAssistantId | null;
  historyOpen: boolean;
  onModeChange: (mode: StudioAssistantId) => void;
  onNewChat: () => void;
  onToggleHistory: () => void;
}

export function ChatHeader({ activeMode, historyOpen, onModeChange, onNewChat, onToggleHistory }: ChatHeaderProps) {
  return (
    <div className={chatHeaderClass}>
      <div className="flex min-w-0 items-center gap-2">
        {historyOpen || !activeMode ? (
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-foreground">
            {historyOpen ? "Chat History" : "Choose Agent"}
          </span>
        ) : (
          <AgentModePicker activeMode={activeMode} onModeChange={onModeChange} />
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <ChatHeaderActionButton
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          tooltip="New chat"
          className={toolButtonClass}
        >
          <MessageSquarePlus size={14} strokeWidth={1.75} />
        </ChatHeaderActionButton>
        <ChatHeaderActionButton
          type="button"
          onClick={onToggleHistory}
          aria-label={historyOpen ? "Close history" : "Open history"}
          aria-pressed={historyOpen}
          tooltip={historyOpen ? "Close history" : "History"}
          className={cn(toolButtonClass, historyOpen && activeControlClass)}
        >
          <FileClock size={14} strokeWidth={1.75} />
        </ChatHeaderActionButton>
      </div>
    </div>
  );
}
