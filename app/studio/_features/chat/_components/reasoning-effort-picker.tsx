"use client";

import React, { useCallback } from "react";
import { Brain, Check, ChevronDown } from "lucide-react";

import { cn } from "@/app/lib/cn";
import {
  activeControlClass,
  chatGlassClass,
  composerTooltipClass,
  controlMenuItemClass,
} from "@/app/studio/_features/chat/_lib/chat-styles";
import { useDropdown } from "@/app/studio/_features/chat/_hooks/use-dropdown";
import type {
  ReasoningEffortId,
  ReasoningEffortOption,
} from "@/app/studio/_features/chat/_lib/models";

interface ReasoningEffortPickerProps {
  value: ReasoningEffortId;
  options: ReasoningEffortOption[];
  onChange: (effortId: ReasoningEffortId) => void;
  disabled?: boolean;
}

export default function ReasoningEffortPicker({
  value,
  options,
  onChange,
  disabled,
}: ReasoningEffortPickerProps) {
  const { isOpen, containerRef, toggle, close } = useDropdown();
  const selected = options.find((effort) => effort.id === value) ?? options[0];

  const handleSelect = useCallback(
    (effortId: ReasoningEffortId) => {
      onChange(effortId);
      close();
    },
    [onChange, close],
  );

  if (!selected) return null;

  return (
    <div ref={containerRef} className="group/composer relative inline-grid">
      <button
        type="button"
        disabled={disabled}
        onClick={() => toggle()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Reasoning effort: ${selected.label}`}
        className="flex h-8 items-center gap-1 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Brain size={13} aria-hidden="true" />
        <span className="max-w-[100px] truncate">{selected.label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {!isOpen ? (
        <span role="tooltip" className={composerTooltipClass}>
          Reasoning effort
        </span>
      ) : null}

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            chatGlassClass,
            "absolute bottom-full left-0 z-20 mb-1 grid w-[min(15rem,calc(100vw-1.5rem))] gap-1 rounded-[var(--viewer-control-radius)] bg-background/95 p-1 text-foreground",
          )}
        >
          {options.map((effort) => {
            const isSelected = effort.id === selected.id;
            return (
              <button
                key={effort.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(effort.id)}
                className={cn(controlMenuItemClass, isSelected && activeControlClass)}
              >
                <span className="flex flex-col">
                  <span className={cn("font-medium", isSelected ? "text-background" : "text-foreground")}>
                    {effort.label}
                  </span>
                  <span className={cn("text-[11px]", isSelected ? "text-background/70" : "text-muted-foreground")}>
                    {effort.description}
                  </span>
                </span>
                {isSelected ? (
                  <Check size={14} className="flex-shrink-0 text-background" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
