"use client";

import React, { useCallback } from "react";
import { Brain, Check, ChevronDown, Lock } from "lucide-react";

import { cn } from "@/app/lib/cn";
import {
  activeControlClass,
  chatGlassClass,
  composerTooltipClass,
  controlMenuItemClass,
  toolTooltipClass,
} from "@/app/lib/chat/chat-styles";
import { useDropdown } from "@/app/hooks/chat/use-dropdown";
import type {
  ReasoningEffortId,
  ReasoningEffortOption,
} from "@/app/lib/chat/models";

const lockedTooltipClass = cn(
  toolTooltipClass,
  "bottom-[calc(100%+0.375rem)] top-auto group-hover/locked:opacity-100 group-focus-within/locked:opacity-100",
);

interface ReasoningEffortPickerProps {
  value: ReasoningEffortId;
  options: ReasoningEffortOption[];
  onChange: (effortId: ReasoningEffortId) => void;
  disabled?: boolean;
  /** Efforts the current user cannot use; selecting one triggers onLockedSelect. */
  lockedOptions?: ReasoningEffortOption[];
  lockedHint?: string;
  onLockedSelect?: () => void;
}

export default function ReasoningEffortPicker({
  value,
  options,
  onChange,
  disabled,
  lockedOptions = [],
  lockedHint,
  onLockedSelect,
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

  const handleLockedSelect = useCallback(() => {
    onLockedSelect?.();
    close();
  }, [onLockedSelect, close]);

  if (!selected) return null;

  const lockedTooltip = lockedHint ?? "Sign in to unlock";

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
          {lockedOptions.length > 0 ? (
            <div className="mx-1 my-0.5 h-px bg-border/45" role="presentation" />
          ) : null}
          {lockedOptions.map((effort) => (
            <button
              key={effort.id}
              type="button"
              role="option"
              aria-selected={false}
              aria-label={`${effort.label} (locked)`}
              onClick={handleLockedSelect}
              className={cn(controlMenuItemClass, "opacity-75 hover:opacity-100")}
            >
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{effort.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {effort.description}
                </span>
              </span>
              <span className="group/locked relative inline-grid shrink-0 place-items-center">
                <Lock size={13} className="text-muted-foreground" />
                <span role="tooltip" className={lockedTooltipClass}>
                  {lockedTooltip}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
