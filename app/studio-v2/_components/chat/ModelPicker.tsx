"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { MODELS } from "@/app/studio-v2/_lib/models";

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (modelId: string) => {
      onChange(modelId);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select model"
        className="flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
          className="absolute bottom-full left-0 z-20 mb-1 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
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
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60"
              >
                <span className="flex flex-col">
                  <span className="font-medium text-foreground">{model.label}</span>
                  <span className="text-[11px] text-muted-foreground">{model.provider}</span>
                </span>
                {isSelected ? (
                  <Check size={14} className="flex-shrink-0 text-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
