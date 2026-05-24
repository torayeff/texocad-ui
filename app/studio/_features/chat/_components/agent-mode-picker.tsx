"use client";

import { useCallback } from "react";
import type { ComponentType } from "react";
import { Box, Check, ChevronDown, Image } from "lucide-react";

import { cn } from "@/app/lib/cn";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  activeControlClass,
  chatGlassClass,
  controlMenuItemClass,
} from "@/app/studio/_features/chat/_lib/chat-styles";
import { useDropdown } from "@/app/studio/_features/chat/_hooks/use-dropdown";

interface AgentModeOption {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  mode: StudioAssistantId;
}

interface AgentModePickerProps {
  activeMode: StudioAssistantId;
  onModeChange: (mode: StudioAssistantId) => void;
}

const AGENT_MODE_OPTIONS: AgentModeOption[] = [
  {
    icon: Box,
    label: "CAD Agent",
    mode: CAD_ASSISTANT_ID,
  },
  {
    icon: Image,
    label: "Sketch Agent",
    mode: SKETCH_ASSISTANT_ID,
  },
];

function activeModeOption(activeMode: StudioAssistantId) {
  return AGENT_MODE_OPTIONS.find((option) => option.mode === activeMode) ?? AGENT_MODE_OPTIONS[0];
}

export function AgentModePicker({ activeMode, onModeChange }: AgentModePickerProps) {
  const { isOpen, containerRef, toggle, close } = useDropdown();
  const selected = activeModeOption(activeMode);
  const SelectedIcon = selected.icon;

  const handleSelect = useCallback((mode: StudioAssistantId) => {
    onModeChange(mode);
    close();
  }, [onModeChange, close]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => toggle()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="-ml-2.5 flex h-8 items-center gap-2 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <SelectedIcon size={14} strokeWidth={1.75} className="text-muted-foreground" />
        <span>{selected.label}</span>
        <ChevronDown
          size={12}
          className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className={cn(
            chatGlassClass,
            "absolute left-0 top-[calc(100%+0.375rem)] z-30 grid w-44 gap-1 rounded-[var(--viewer-control-radius)] p-1 text-foreground",
          )}
        >
          {AGENT_MODE_OPTIONS.map((option) => {
            const isSelected = option.mode === activeMode;
            const OptionIcon = option.icon;
            return (
              <button
                key={option.mode}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.mode)}
                className={cn(controlMenuItemClass, isSelected && activeControlClass)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <OptionIcon
                    size={14}
                    strokeWidth={1.75}
                    className={cn("shrink-0", isSelected ? "text-background" : "text-muted-foreground")}
                  />
                  <span className={cn("truncate font-medium", isSelected ? "text-background" : "text-foreground")}>
                    {option.label}
                  </span>
                </span>
                {isSelected ? (
                  <Check size={14} className="shrink-0 text-background" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
