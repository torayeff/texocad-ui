"use client";

import React, { useCallback } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/app/lib/cn";
import { MODELS } from "@/app/studio/_features/chat/_lib/models";
import {
  activeControlClass,
  chatGlassClass,
  controlMenuItemClass,
} from "@/app/studio/_features/chat/_lib/chat-styles";
import { useDropdown } from "@/app/studio/_features/chat/_hooks/use-dropdown";

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const { isOpen, containerRef, toggle, close } = useDropdown();

  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  const handleSelect = useCallback(
    (modelId: string) => {
      onChange(modelId);
      close();
    },
    [onChange, close],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => toggle()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select model"
        className="flex h-8 items-center gap-1 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="max-w-[140px] truncate">{selected.label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            chatGlassClass,
            "absolute bottom-full left-0 z-20 mb-1 grid w-[min(15rem,calc(100vw-1.5rem))] gap-1 rounded-[var(--viewer-control-radius)] p-1 text-foreground",
          )}
        >
          {MODELS.map((model) => {
            const isSelected = model.id === selected.id;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(model.id)}
                className={cn(controlMenuItemClass, isSelected && activeControlClass)}
              >
                <span className="flex flex-col">
                  <span className={cn("font-medium", isSelected ? "text-background" : "text-foreground")}>
                    {model.label}
                  </span>
                  <span className={cn("text-[11px]", isSelected ? "text-background/70" : "text-muted-foreground")}>
                    {model.provider}
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
