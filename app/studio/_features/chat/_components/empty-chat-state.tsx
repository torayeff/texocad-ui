import { Loader2 } from "lucide-react";

import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { chatGlassClass } from "@/app/studio/_features/chat/_lib/chat-styles";

interface ExamplePrompt {
  label: string;
  description: string;
  mode: StudioAssistantId;
}

interface AgentExamplePrompt {
  description: string;
  label: string;
  prompt: string;
}

const MODE_SELECTION_PROMPTS: ExamplePrompt[] = [
  {
    label: "Sketch image",
    description: "Generate a visual sketch image.",
    mode: SKETCH_ASSISTANT_ID,
  },
  {
    label: "CAD model",
    description: "Generate a BREP STEP model.",
    mode: CAD_ASSISTANT_ID,
  },
];

const AGENT_EXAMPLE_PROMPTS: Record<StudioAssistantId, AgentExamplePrompt[]> = {
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
  isHydrating,
  isBusy,
  onModeSelect,
  onPromptSelect,
}: {
  activeMode: StudioAssistantId | null;
  isHydrating: boolean;
  isBusy: boolean;
  onModeSelect: (mode: StudioAssistantId) => void;
  onPromptSelect: (prompt: string) => void;
}) {
  if (isHydrating) {
    return (
      <div className="mx-auto flex min-h-[320px] w-full max-w-2xl items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-center gap-2 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (isBusy) {
    return null;
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
    <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="flex w-full flex-col items-center text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            What do you want to build?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Start with a visual concept or a CAD-ready model.
          </p>
        </div>

        <div className="mt-6 flex w-full justify-center">
          <div className={`${chatGlassClass} relative grid w-full max-w-sm grid-cols-2 gap-1.5 rounded-[calc(var(--viewer-control-radius)+0.375rem)] p-1.5 before:absolute before:inset-y-2 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border/45 before:content-['']`}>
            {MODE_SELECTION_PROMPTS.map((example) => (
              <button
                key={example.label}
                onClick={() => onModeSelect(example.mode)}
                aria-pressed={activeMode === example.mode}
                className={`rounded-[var(--viewer-control-radius)] border px-3 py-2.5 text-center transition-[background-color,border-color,color,box-shadow] ${activeMode === example.mode
                  ? "border-border bg-background text-foreground shadow-[0_4px_14px_rgb(0_0_0_/_0.10)]"
                  : "border-transparent text-foreground/85 hover:border-border/45 hover:bg-muted hover:text-foreground"
                  }`}
              >
                <span className="block text-sm font-medium">{example.label}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{example.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
