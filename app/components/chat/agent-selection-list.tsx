"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Box, ChevronRight, ImageIcon, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  CAD_ASSISTANT_ID,
  CLARI_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import { trackEvent } from "@/app/lib/analytics/client";
import { cn } from "@/app/lib/cn";
import { toolTooltipClass } from "@/app/lib/chat/chat-styles";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

const lockedTooltipClass = cn(
  toolTooltipClass,
  "bottom-[calc(100%+0.375rem)] top-auto group-hover/locked:opacity-100 group-focus-within/locked:opacity-100",
);

interface AgentSelectionOption {
  avatarUrl?: string;
  description: string;
  icon?: LucideIcon;
  label: string;
  mode: AssistantId | null;
  role: string;
}

const PRIMARY_AGENT_OPTIONS: AgentSelectionOption[] = [
  {
    avatarUrl: "/images/agents/clari.png",
    label: "Clari",
    role: "Requirements engineer",
    description: "Briefs with requirements and success criteria.",
    mode: CLARI_ASSISTANT_ID,
  },
  {
    avatarUrl: "/images/agents/lumi.png",
    label: "Lumi",
    role: "Concept engineer",
    description: "Images and GLB-ready 3D assets.",
    mode: LUMI_ASSISTANT_ID,
  },
  {
    avatarUrl: "/images/agents/forma.png",
    label: "Forma",
    role: "CAD engineer",
    description: "CAD parts and STEP-ready assemblies.",
    mode: FORMA_ASSISTANT_ID,
  },
  {
    avatarUrl: "/images/agents/nexis.png",
    label: "Nexis",
    role: "Simulation engineer",
    description: "Tests designs, processes, and performance.",
    mode: null,
  },
];

const LEGACY_AGENT_OPTIONS: AgentSelectionOption[] = [
  {
    icon: ImageIcon,
    label: "Sketch",
    role: "Legacy image agent",
    description: "Concept sketches.",
    mode: SKETCH_ASSISTANT_ID,
  },
  {
    icon: Box,
    label: "CAD",
    role: "Legacy CAD agent",
    description: "BREP CAD designs.",
    mode: CAD_ASSISTANT_ID,
  },
];

function AgentIcon({ option }: { option: AgentSelectionOption }) {
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

  if (!option.icon) return null;

  const Icon = option.icon;
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
  option: AgentSelectionOption;
  onLockedSelect?: () => void;
  onModeSelect: (mode: AssistantId) => void;
}) {
  const isComingSoon = option.mode === null;
  const isUnavailable = isComingSoon || isLocked;

  return (
    <button
      type="button"
      disabled={isComingSoon}
      aria-label={isLocked ? `${option.label} (locked)` : undefined}
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
          <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">{option.label}</span>
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
  const { has, isLoaded, isSignedIn, sessionClaims } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
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

  const handleLockedAgentSelect = () => {
    if (lockedAgentAction === "upgrade") {
      trackEvent("auth_gate_clicked", {
        action: "upgrade",
        gate: "agent_selection",
        is_signed_in: Boolean(isSignedIn),
      });
      trackEvent("upgrade_clicked", {
        gate: "agent_selection",
        location: "agent_selection",
      });
      router.push(SITE_ROUTES.pricing);
      return;
    }
    trackEvent("auth_gate_clicked", {
      action: "sign-in",
      gate: "agent_selection",
      is_signed_in: Boolean(isSignedIn),
    });
    trackEvent("sign_in_opened", {
      gate: "agent_selection",
      location: "agent_selection",
    });
    openSignIn();
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <section className="grid gap-2">
        {PRIMARY_AGENT_OPTIONS.map((option) => (
          <AgentOptionButton
            key={option.label}
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
          {LEGACY_AGENT_OPTIONS.map((option) => (
            <AgentOptionButton
              key={option.label}
              isLocked={shouldLockRestrictedAgents}
              lockedTooltip={lockedAgentTooltip}
              option={option}
              isLegacy
              onLockedSelect={handleLockedAgentSelect}
              onModeSelect={onModeSelect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
