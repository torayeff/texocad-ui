"use client";

import { useCallback } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Box, Check, ChevronDown, Image, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/app/lib/cn";
import {
  CAD_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import {
  LEGACY_AGENT_CONFIGS,
  PRIMARY_AGENT_CONFIGS,
  agentConfigForMode,
  agentLabelForMode,
  type AgentConfig,
} from "@/app/lib/chat/agent-config";
import { trackEvent } from "@/app/lib/analytics/client";
import {
  activeControlClass,
  chatGlassClass,
  controlMenuItemClass,
  toolTooltipClass,
} from "@/app/lib/chat/chat-styles";
import { useDropdown } from "@/app/hooks/chat/use-dropdown";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

const lockedTooltipClass = cn(
  toolTooltipClass,
  "bottom-[calc(100%+0.375rem)] top-auto group-hover/locked:opacity-100 group-focus-within/locked:opacity-100",
);

interface AgentModePickerProps {
  activeMode: AssistantId;
  onModeChange: (mode: AssistantId) => void;
}

const LEGACY_AGENT_ICONS: Partial<Record<AssistantId, LucideIcon>> = {
  [SKETCH_ASSISTANT_ID]: Image,
  [CAD_ASSISTANT_ID]: Box,
};

function activeModeOption(activeMode: AssistantId) {
  return agentConfigForMode(activeMode);
}

function optionLabel(option: AgentConfig) {
  return option.mode ? agentLabelForMode(option.mode) : option.name;
}

function optionSubtitle(option: AgentConfig) {
  return option.isLegacy ? option.description : option.role;
}

function AgentModeIcon({
  isSelected = false,
  option,
  placement,
}: {
  isSelected?: boolean;
  option: AgentConfig;
  placement: "option" | "trigger";
}) {
  const isTrigger = placement === "trigger";
  const frameSizeClass = isTrigger ? "size-[1.375rem]" : "size-6";

  if (option.avatarUrl) {
    const size = isTrigger ? 22 : 24;
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full", frameSizeClass)}>
        <NextImage
          src={option.avatarUrl}
          alt=""
          width={size}
          height={size}
          className="size-full rounded-full object-cover ring-1 ring-border/50"
        />
      </span>
    );
  }

  const Icon = option.mode ? LEGACY_AGENT_ICONS[option.mode] : undefined;
  if (!Icon) return null;

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
  isComingSoon = false,
  isLocked = false,
  isLegacy = false,
  lockedTooltip = "Sign in to unlock",
  onLockedSelect,
  onSelect,
  option,
}: {
  activeMode: AssistantId;
  isComingSoon?: boolean;
  isLocked?: boolean;
  isLegacy?: boolean;
  lockedTooltip?: string;
  onLockedSelect?: () => void;
  onSelect: (mode: AssistantId) => void;
  option: AgentConfig;
}) {
  const isSelected = option.mode === activeMode;
  const isUnavailable = isComingSoon || isLocked;
  const label = optionLabel(option);

  return (
    <button
      type="button"
      role="option"
      disabled={isComingSoon}
      aria-selected={isSelected}
      aria-label={isComingSoon ? `${label} (coming soon)` : isLocked ? `${label} (locked)` : undefined}
      onClick={() => {
        if (isLocked) {
          onLockedSelect?.();
          return;
        }
        if (option.mode !== null) onSelect(option.mode);
      }}
      className={cn(
        controlMenuItemClass,
        "min-h-10 px-2.5 py-1.5",
        (isLegacy || isUnavailable) && !isSelected && "opacity-75 hover:opacity-100",
        isComingSoon && "cursor-not-allowed hover:bg-transparent hover:text-inherit",
        isSelected && activeControlClass,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <AgentModeIcon isSelected={isSelected} option={option} placement="option" />
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("truncate font-medium", isSelected ? "text-background" : "text-foreground")}>
              {label}
            </span>
            {isComingSoon ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Coming soon
              </span>
            ) : null}
          </span>
          <span className={cn("block truncate text-[10px] font-normal leading-[0.875rem]", isSelected ? "text-background/70" : "text-muted-foreground")}>
            {optionSubtitle(option)}
          </span>
        </span>
      </span>
      {isSelected ? (
        <Check size={13} className="shrink-0 text-background" />
      ) : isLocked ? (
        <span className="group/locked relative inline-grid shrink-0 place-items-center">
          <Lock size={13} className="text-muted-foreground" />
          <span role="tooltip" className={lockedTooltipClass}>
            {lockedTooltip}
          </span>
        </span>
      ) : null}
    </button>
  );
}

export function AgentModePicker({ activeMode, onModeChange }: AgentModePickerProps) {
  const { isOpen, containerRef, toggle, close } = useDropdown();
  const { has, isLoaded, isSignedIn, sessionClaims } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const selected = activeModeOption(activeMode);
  const hasAgentAccess = Boolean(
    isSignedIn
    && (
      has?.({ plan: CLERK_PLAN_SLUG })
      || sessionClaims?.freeAccess === true
      || sessionClaims?.vipAccess === true
    ),
  );
  const lockedAgentAction = !isLoaded || hasAgentAccess
    ? null
    : (isSignedIn ? "upgrade" : "sign-in");
  const shouldLockRestrictedAgents = lockedAgentAction !== null;
  const lockedAgentTooltip = lockedAgentAction === "upgrade"
    ? "Upgrade to unlock"
    : "Sign in to unlock";

  const handleSelect = useCallback((mode: AssistantId) => {
    onModeChange(mode);
    close();
  }, [onModeChange, close]);

  const handleLockedSelect = useCallback(() => {
    if (lockedAgentAction === "upgrade") {
      trackEvent("auth_gate_clicked", {
        action: "upgrade",
        gate: "agent_mode_picker",
        is_signed_in: Boolean(isSignedIn),
      });
      trackEvent("upgrade_clicked", {
        gate: "agent_mode_picker",
        location: "agent_mode_picker",
      });
      router.push(SITE_ROUTES.pricing);
      close();
      return;
    }
    trackEvent("auth_gate_clicked", {
      action: "sign-in",
      gate: "agent_mode_picker",
      is_signed_in: Boolean(isSignedIn),
    });
    trackEvent("sign_in_opened", {
      gate: "agent_mode_picker",
      location: "agent_mode_picker",
    });
    openSignIn();
    close();
  }, [close, isSignedIn, lockedAgentAction, openSignIn, router]);

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
        <span className="truncate">{optionLabel(selected)}</span>
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
          {PRIMARY_AGENT_CONFIGS.map((option) => (
            <AgentModeOptionButton
              key={option.key}
              activeMode={activeMode}
              isComingSoon={option.isComingSoon === true}
              isLocked={
                shouldLockRestrictedAgents
                && option.mode !== null
              }
              lockedTooltip={lockedAgentTooltip}
              option={option}
              onLockedSelect={handleLockedSelect}
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

          {LEGACY_AGENT_CONFIGS.map((option) => (
            <AgentModeOptionButton
              key={option.key}
              activeMode={activeMode}
              isLocked={shouldLockRestrictedAgents}
              isLegacy={option.isLegacy}
              lockedTooltip={lockedAgentTooltip}
              option={option}
              onLockedSelect={handleLockedSelect}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
