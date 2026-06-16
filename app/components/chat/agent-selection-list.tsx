"use client";

import Image from "next/image";
import { Box, ChevronRight, ImageIcon, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  CAD_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import {
  LEGACY_AGENT_CONFIGS,
  PRIMARY_AGENT_CONFIGS,
  type AgentConfig,
} from "@/app/lib/chat/agent-config";
import { cn } from "@/app/lib/cn";
import { toolTooltipClass } from "@/app/lib/chat/chat-styles";
import { useAgentAccessGate } from "@/app/hooks/chat/use-agent-access-gate";

const lockedTooltipClass = cn(
  toolTooltipClass,
  "bottom-[calc(100%+0.375rem)] top-auto group-hover/locked:opacity-100 group-focus-within/locked:opacity-100",
);

const LEGACY_AGENT_ICONS: Partial<Record<AssistantId, LucideIcon>> = {
  [SKETCH_ASSISTANT_ID]: ImageIcon,
  [CAD_ASSISTANT_ID]: Box,
};

function AgentIcon({ option }: { option: AgentConfig }) {
  if (option.avatarUrl) {
    return (
      <Image
        src={option.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full object-cover shadow-[0_1px_2px_rgb(0_0_0_/_0.08)] ring-1 ring-border/50"
      />
    );
  }

  const Icon = option.mode ? LEGACY_AGENT_ICONS[option.mode] : undefined;
  if (!Icon) return null;

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border/45 bg-muted/70 text-muted-foreground">
      <Icon size={16} strokeWidth={1.7} />
    </span>
  );
}

function AgentOptionButton({
  isLocked = false,
  isLegacy = false,
  lockedTooltip = "Sign in to unlock",
  option,
  onLockedSelect,
  onModeSelect,
}: {
  isLocked?: boolean;
  isLegacy?: boolean;
  lockedTooltip?: string;
  option: AgentConfig;
  onLockedSelect?: () => void;
  onModeSelect: (mode: AssistantId) => void;
}) {
  const isComingSoon = option.mode === null;
  const isUnavailable = isComingSoon || isLocked;

  return (
    <button
      type="button"
      disabled={isComingSoon}
      aria-label={isLocked ? `${option.name} (locked)` : undefined}
      onClick={() => {
        if (isLocked) {
          onLockedSelect?.();
          return;
        }
        if (option.mode !== null) onModeSelect(option.mode);
      }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[calc(var(--viewer-control-radius)+0.25rem)] border bg-background/75 text-left shadow-[0_1px_2px_rgb(0_0_0_/_0.035)] transition-[background-color,border-color,box-shadow,color,opacity]",
        "border-border/40",
        isLegacy ? "px-3 py-2.5" : "px-4 py-3",
        isUnavailable
          ? "opacity-60"
          : "hover:border-border/80 hover:bg-background hover:text-foreground hover:shadow-[0_8px_22px_rgb(0_0_0_/_0.06)]",
        isLocked && "hover:border-border/70 hover:bg-background hover:opacity-100",
        isLegacy && "bg-background/45 opacity-80 shadow-none hover:opacity-100",
      )}
    >
      <AgentIcon option={option} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">{option.name}</span>
          <span className="text-[11px] font-medium text-muted-foreground">{option.role}</span>
        </span>
        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
          {option.description}
        </span>
      </span>
      {isComingSoon ? (
        <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Coming soon
        </span>
      ) : isLocked ? (
        <span className="group/locked relative inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          <Lock size={11} strokeWidth={2} />
          <span role="tooltip" className={lockedTooltipClass}>
            {lockedTooltip}
          </span>
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center text-muted-foreground/0 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muted-foreground">
          <ChevronRight size={15} strokeWidth={2} />
        </span>
      )}
    </button>
  );
}

export function AgentSelectionList({
  onModeSelect,
}: {
  onModeSelect: (mode: AssistantId) => void;
}) {
  const {
    handleLockedAgentSelect,
    lockedAgentTooltip,
    shouldLockRestrictedAgents,
  } = useAgentAccessGate({
    gate: "agent_selection",
    location: "agent_selection",
  });

  return (
    <div className="w-full max-w-xl space-y-4">
      <section className="grid gap-2">
        {PRIMARY_AGENT_CONFIGS.map((option) => (
          <AgentOptionButton
            key={option.key}
            isLocked={
              shouldLockRestrictedAgents
              && option.mode !== null
            }
            lockedTooltip={lockedAgentTooltip}
            option={option}
            onLockedSelect={handleLockedAgentSelect}
            onModeSelect={onModeSelect}
          />
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-left text-xs font-medium text-muted-foreground">
          Legacy agents
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEGACY_AGENT_CONFIGS.map((option) => (
            <AgentOptionButton
              key={option.key}
              isLocked={shouldLockRestrictedAgents}
              lockedTooltip={lockedAgentTooltip}
              option={option}
              isLegacy={option.group === "legacy"}
              onLockedSelect={handleLockedAgentSelect}
              onModeSelect={onModeSelect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
