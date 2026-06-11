"use client";

import Image from "next/image";
import { Archive, ArrowRight, Box, ImageIcon, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  CAD_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import { cn } from "@/app/lib/cn";

interface AgentSelectionOption {
  avatarUrl?: string;
  description: string;
  icon?: LucideIcon;
  label: string;
  mode: AssistantId;
  role: string;
}

const PRIMARY_AGENT_OPTIONS: AgentSelectionOption[] = [
  {
    avatarUrl: "/images/agents/lumi.png",
    label: "Lumi",
    role: "Concept designer",
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
    role: "Legacy BREP CAD agent",
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
        width={44}
        height={44}
        className="size-11 rounded-full object-cover shadow-[0_1px_2px_rgb(0_0_0_/_0.08)] ring-1 ring-border/50"
      />
    );
  }

  if (!option.icon) return null;

  const Icon = option.icon;
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border/45 bg-muted/70 text-muted-foreground">
      <Icon size={17} strokeWidth={1.7} />
    </span>
  );
}

function AgentOptionButton({
  isLegacy = false,
  option,
  onModeSelect,
}: {
  isLegacy?: boolean;
  option: AgentSelectionOption;
  onModeSelect: (mode: AssistantId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onModeSelect(option.mode)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[calc(var(--viewer-control-radius)+0.125rem)] border bg-background/70 px-3.5 py-3 text-left shadow-[0_1px_2px_rgb(0_0_0_/_0.04)] transition-[background-color,border-color,box-shadow,color,opacity] hover:border-border/80 hover:bg-background hover:text-foreground hover:shadow-[0_8px_22px_rgb(0_0_0_/_0.06)]",
        "border-border/40",
        isLegacy && "opacity-75 hover:opacity-100",
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
      <span className="inline-flex shrink-0 items-center text-muted-foreground/0 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muted-foreground">
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </button>
  );
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      <Icon size={13} strokeWidth={1.7} />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export function AgentSelectionList({
  onModeSelect,
}: {
  onModeSelect: (mode: AssistantId) => void;
}) {
  return (
    <div className="w-full max-w-lg space-y-4">
      <section className="space-y-2">
        <SectionLabel icon={Sparkles}>Recommended agents</SectionLabel>
        {PRIMARY_AGENT_OPTIONS.map((option) => (
          <AgentOptionButton
            key={option.mode}
            option={option}
            onModeSelect={onModeSelect}
          />
        ))}
      </section>

      <section className="space-y-2">
        <SectionLabel icon={Archive}>Legacy agents</SectionLabel>
        {LEGACY_AGENT_OPTIONS.map((option) => (
          <AgentOptionButton
            key={option.mode}
            option={option}
            isLegacy
            onModeSelect={onModeSelect}
          />
        ))}
      </section>
    </div>
  );
}
