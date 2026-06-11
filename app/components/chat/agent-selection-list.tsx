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
    role: "Parametric CAD agent",
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
        width={64}
        height={64}
        className="size-16 rounded-full object-cover ring-1 ring-border/50"
      />
    );
  }

  if (!option.icon) return null;

  const Icon = option.icon;
  return (
    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
      <Icon size={24} strokeWidth={1.6} />
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
        "group flex w-full items-center gap-4 rounded-[calc(var(--viewer-control-radius)+0.25rem)] border bg-background/70 px-4 py-4 text-left shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] transition-[background-color,border-color,box-shadow,color,opacity] hover:border-border hover:bg-background hover:text-foreground",
        "border-border/40",
        isLegacy && "opacity-60 hover:opacity-85",
      )}
    >
      <AgentIcon option={option} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-semibold text-foreground">{option.label}</span>
          <span className="text-xs font-medium text-muted-foreground">{option.role}</span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {option.description}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center text-muted-foreground/0 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muted-foreground">
        <ArrowRight size={16} strokeWidth={2} />
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
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      <Icon size={14} strokeWidth={1.7} />
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
    <div className="w-full max-w-xl space-y-5">
      <section className="space-y-3">
        <SectionLabel icon={Sparkles}>Recommended agents</SectionLabel>
        {PRIMARY_AGENT_OPTIONS.map((option) => (
          <AgentOptionButton
            key={option.mode}
            option={option}
            onModeSelect={onModeSelect}
          />
        ))}
      </section>

      <section className="space-y-3">
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
