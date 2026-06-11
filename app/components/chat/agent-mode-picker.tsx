"use client";

import { useCallback } from "react";
import type { ComponentType } from "react";
import NextImage from "next/image";
import { Box, Check, ChevronDown, Image } from "lucide-react";

import { cn } from "@/app/lib/cn";
import {
  CAD_ASSISTANT_ID,
  CLARI_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import {
  activeControlClass,
  chatGlassClass,
  controlMenuItemClass,
} from "@/app/lib/chat/chat-styles";
import { useDropdown } from "@/app/hooks/chat/use-dropdown";

interface AgentIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function LumiPortraitIcon({ size = 14, className }: AgentIconProps) {
  return (
    <NextImage
      src="/images/agents/lumi.png"
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full object-cover ring-1 ring-border/50", className)}
    />
  );
}

function FormaPortraitIcon({ size = 14, className }: AgentIconProps) {
  return (
    <NextImage
      src="/images/agents/forma.png"
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full object-cover ring-1 ring-border/50", className)}
    />
  );
}

function ClariPortraitIcon({ size = 14, className }: AgentIconProps) {
  return (
    <NextImage
      src="/images/agents/clari.png"
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full object-cover ring-1 ring-border/50", className)}
    />
  );
}

interface AgentModeOption {
  icon: ComponentType<AgentIconProps>;
  iconKind: "glyph" | "portrait";
  label: string;
  mode: AssistantId;
  role: string;
}

interface AgentModePickerProps {
  activeMode: AssistantId;
  onModeChange: (mode: AssistantId) => void;
}

const PRIMARY_AGENT_MODE_OPTIONS: AgentModeOption[] = [
  {
    icon: ClariPortraitIcon,
    iconKind: "portrait",
    label: "Clari",
    mode: CLARI_ASSISTANT_ID,
    role: "Requirements engineer",
  },
  {
    icon: LumiPortraitIcon,
    iconKind: "portrait",
    label: "Lumi",
    mode: LUMI_ASSISTANT_ID,
    role: "Concept engineer",
  },
  {
    icon: FormaPortraitIcon,
    iconKind: "portrait",
    label: "Forma",
    mode: FORMA_ASSISTANT_ID,
    role: "CAD engineer",
  },
];

const LEGACY_AGENT_MODE_OPTIONS: AgentModeOption[] = [
  {
    icon: Image,
    iconKind: "glyph",
    label: "Sketch (Legacy)",
    mode: SKETCH_ASSISTANT_ID,
    role: "Concept sketches",
  },
  {
    icon: Box,
    iconKind: "glyph",
    label: "CAD (Legacy)",
    mode: CAD_ASSISTANT_ID,
    role: "BREP CAD",
  },
];

const AGENT_MODE_OPTIONS = [
  ...PRIMARY_AGENT_MODE_OPTIONS,
  ...LEGACY_AGENT_MODE_OPTIONS,
];

function activeModeOption(activeMode: AssistantId) {
  return AGENT_MODE_OPTIONS.find((option) => option.mode === activeMode) ?? AGENT_MODE_OPTIONS[0];
}

function AgentModeIcon({
  isSelected = false,
  option,
  placement,
}: {
  isSelected?: boolean;
  option: AgentModeOption;
  placement: "option" | "trigger";
}) {
  const Icon = option.icon;
  const isTrigger = placement === "trigger";
  const frameSizeClass = isTrigger ? "size-[1.375rem]" : "size-6";

  if (option.iconKind === "portrait") {
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full", frameSizeClass)}>
        <Icon size={isTrigger ? 22 : 24} className="size-full" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-border/45 bg-muted/70",
        frameSizeClass,
        isSelected ? "border-background/30 bg-background/15 text-background" : "text-muted-foreground",
      )}
    >
      <Icon size={isTrigger ? 14 : 15} strokeWidth={1.75} />
    </span>
  );
}

function AgentModeOptionButton({
  activeMode,
  isLegacy = false,
  onSelect,
  option,
}: {
  activeMode: AssistantId;
  isLegacy?: boolean;
  onSelect: (mode: AssistantId) => void;
  option: AgentModeOption;
}) {
  const isSelected = option.mode === activeMode;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(option.mode)}
      className={cn(
        controlMenuItemClass,
        "min-h-10 px-2.5 py-1.5",
        isLegacy && !isSelected && "opacity-75 hover:opacity-100",
        isSelected && activeControlClass,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <AgentModeIcon isSelected={isSelected} option={option} placement="option" />
        <span className="min-w-0">
          <span className={cn("block truncate font-medium", isSelected ? "text-background" : "text-foreground")}>
            {option.label}
          </span>
          <span className={cn("block truncate text-[10px] font-normal leading-[0.875rem]", isSelected ? "text-background/70" : "text-muted-foreground")}>
            {option.role}
          </span>
        </span>
      </span>
      {isSelected ? (
        <Check size={13} className="shrink-0 text-background" />
      ) : null}
    </button>
  );
}

export function AgentModePicker({ activeMode, onModeChange }: AgentModePickerProps) {
  const { isOpen, containerRef, toggle, close } = useDropdown();
  const selected = activeModeOption(activeMode);

  const handleSelect = useCallback((mode: AssistantId) => {
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
        className="-ml-2 flex h-8 items-center gap-2 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 text-[13px] font-semibold tracking-[-0.01em] text-foreground transition-colors hover:bg-muted"
      >
        <AgentModeIcon option={selected} placement="trigger" />
        <span className="truncate">{selected.label}</span>
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
            "absolute left-0 top-[calc(100%+0.375rem)] z-30 grid w-56 gap-1 rounded-[var(--viewer-control-radius)] bg-background/95 p-1 text-foreground shadow-[0_14px_36px_rgb(0_0_0_/_0.16)]",
          )}
        >
          {PRIMARY_AGENT_MODE_OPTIONS.map((option) => (
            <AgentModeOptionButton
              key={option.mode}
              activeMode={activeMode}
              option={option}
              onSelect={handleSelect}
            />
          ))}

          <div className="my-0.5 flex items-center gap-2 px-2" role="separator">
            <span className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Legacy agents
            </span>
            <span className="h-px flex-1 bg-border/60" />
          </div>

          {LEGACY_AGENT_MODE_OPTIONS.map((option) => (
            <AgentModeOptionButton
              key={option.mode}
              activeMode={activeMode}
              isLegacy
              option={option}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
