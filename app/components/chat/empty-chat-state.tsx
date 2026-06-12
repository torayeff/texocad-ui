"use client";

import Image from "next/image";

import { AgentSelectionList } from "@/app/components/chat/agent-selection-list";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import {
  CAD_ASSISTANT_ID,
  CLARI_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
} from "@/app/lib/chat/langgraph-config";

interface AgentExamplePrompt {
  description: string;
  label: string;
  prompt: string;
}

type GreetingAssistantId =
  | typeof CLARI_ASSISTANT_ID
  | typeof LUMI_ASSISTANT_ID
  | typeof FORMA_ASSISTANT_ID;
type ExamplePromptAssistantId = Exclude<AssistantId, GreetingAssistantId>;

interface AgentGreeting {
  alt: string;
  avatarUrl: string;
  description: string;
  title: string;
}

const AGENT_GREETINGS: Record<GreetingAssistantId, AgentGreeting> = {
  [CLARI_ASSISTANT_ID]: {
    alt: "Clari",
    avatarUrl: "/images/agents/clari.png",
    description: "I turn rough ideas into clear, complete briefs. Tell me what you want to build; I'll ask focused questions, capture requirements, constraints, and success criteria, and deliver a brief ready to hand off.",
    title: "Hi, I'm Clari",
  },
  [LUMI_ASSISTANT_ID]: {
    alt: "Lumi",
    avatarUrl: "/images/agents/lumi.png",
    description: "I turn ideas into 3D assets from prompts, sketches, or reference images. Give me the object, style, and level of detail; I'll create images, export GLB files, and iterate revisions with you.",
    title: "Hi, I'm Lumi",
  },
  [FORMA_ASSISTANT_ID]: {
    alt: "Forma",
    avatarUrl: "/images/agents/forma.png",
    description: "I turn requirements into precise parametric CAD for parts and assemblies. Give me dimensions, interfaces, constraints, and function; I'll build CAD, export STEP files, and iterate revisions with you.",
    title: "Hi, I'm Forma",
  },
};

function isGreetingAssistantId(mode: AssistantId | null): mode is GreetingAssistantId {
  return mode === CLARI_ASSISTANT_ID
    || mode === LUMI_ASSISTANT_ID
    || mode === FORMA_ASSISTANT_ID;
}

const AGENT_EXAMPLE_PROMPTS: Record<ExamplePromptAssistantId, AgentExamplePrompt[]> = {
  [CAD_ASSISTANT_ID]: [
    {
      description: "Wall-mounted sensor case.",
      label: "Sensor enclosure",
      prompt: "Design a wall-mounted enclosure for a small temperature and humidity sensor. Include a removable front cover, ventilation slots that protect the electronics, two internal PCB standoffs, rear screw mounting holes, 2 mm wall thickness, rounded corners, and dimensions around 70 mm x 45 mm x 22 mm.",
    },
    {
      description: "Under-desk cable mount.",
      label: "Cable bracket",
      prompt: "Create an under-desk cable management bracket for 3D printing. Include a flat mounting flange with two countersunk screw holes, a rounded open channel for a bundle of cables, a small retaining lip, 3 mm wall thickness, chamfered edges, and enough clearance for easy cable insertion.",
    },
  ],
  [SKETCH_ASSISTANT_ID]: [
    {
      description: "Clinic check-in device.",
      label: "Kiosk concept",
      prompt: "Sketch a compact tabletop check-in kiosk for a small clinic. Show a tilted touchscreen, stable weighted base, privacy shield around the display, subtle cable exit at the rear, soft rounded corners, and a clean medical-product aesthetic.",
    },
    {
      description: "Workshop measuring tool.",
      label: "Tool concept",
      prompt: "Generate a visual concept for a handheld workshop measuring tool. Show a durable rubberized grip, small top display, thumb buttons, a protected measuring probe, visible part seams for assembly, and a rugged but simple industrial design.",
    },
  ],
};

export default function EmptyChatState({
  activeMode,
  isBusy,
  onModeSelect,
  onPromptSelect,
}: {
  activeMode: AssistantId | null;
  isBusy: boolean;
  onModeSelect: (mode: AssistantId) => void;
  onPromptSelect: (prompt: string) => void;
}) {
  if (isBusy) {
    return null;
  }

  if (isGreetingAssistantId(activeMode)) {
    const greeting = AGENT_GREETINGS[activeMode];

    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 sm:px-6 sm:py-8">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Image
            src={greeting.avatarUrl}
            alt={greeting.alt}
            width={128}
            height={128}
            priority
            className="size-32 rounded-full object-cover shadow-[0_12px_32px_rgb(0_0_0_/_0.12)] ring-1 ring-border/60"
          />
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            {greeting.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {greeting.description}
          </p>
        </div>
      </div>
    );
  }

  if (activeMode) {
    const examples = AGENT_EXAMPLE_PROMPTS[activeMode];
    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full flex-col items-center text-center">
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Try an example
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Start from a realistic brief, then shape the details.
            </p>
          </div>

          <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-1.5 sm:grid-cols-2">
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => onPromptSelect(example.prompt)}
                className="rounded-[var(--viewer-control-radius)] border border-border/35 bg-transparent px-3 py-2.5 text-left transition-[background-color,border-color,color] hover:border-border/70 hover:bg-muted hover:text-foreground"
              >
                <span className="block text-sm font-medium text-foreground">{example.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {example.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="flex w-full flex-col items-center text-center">
        <div className="max-w-lg space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">
            Choose an agent to start building
          </h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Pick the right specialist agent for your task.
          </p>
        </div>

        <div className="mt-7 flex w-full justify-center">
          <AgentSelectionList onModeSelect={onModeSelect} />
        </div>
      </div>
    </div>
  );
}
