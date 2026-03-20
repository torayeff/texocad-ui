import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";

import { engines } from "@/app/studio/_lib/langgraph-config";
import type { EngineKey } from "@/app/studio/_lib/langgraph-config";

const ENGINE_KEYS = Object.keys(engines) as EngineKey[];

const EXAMPLE_PROMPTS = [
  {
    label: "Spur gear",
    prompt:
      "Create a spur gear with 24 teeth, a 2 mm module, a 12 mm center bore, and an 8 mm thickness. Add a 2 mm keyway and 0.5 mm chamfers on both faces.",
  },
  {
    label: "Mounting bracket",
    prompt:
      "Design an L-shaped mounting bracket from 4 mm sheet metal with 80 mm and 60 mm legs, a 30 mm flange height, two 6 mm mounting holes on the base, and a 20 mm cable slot on the upright face.",
  },
  {
    label: "Phone stand",
    prompt:
      "Design a desk phone stand for a smartphone with a 75 mm wide base, a back support tilted at 70 degrees, and a 12 mm front lip to hold the device. Add a cable slot at the bottom for charging access and soften the outside edges with 3 mm fillets.",
  },
  {
    label: "Pen holder",
    prompt:
      "Create a round desk pen holder with a 90 mm outer diameter, a 70 mm inner diameter, and a 110 mm height. Add a 4 mm thick base and a shallow finger cutout on one side to make it easier to grab pens.",
  },
  {
    label: "Soap dish",
    prompt:
      "Model a rectangular soap dish that is 120 mm long, 85 mm wide, and 18 mm tall with rounded corners. Add shallow drainage channels across the top surface and four small feet underneath to lift it off the counter.",
  },
  {
    label: "Storage tray",
    prompt:
      "Create a small desktop storage tray with an overall size of 180 mm by 120 mm and a height of 25 mm. Divide the inside into three compartments for keys, coins, and small accessories, and round the top edges with 2 mm fillets.",
  },
];

export default function EmptyChatState({
  isHydrating,
  isBusy,
  selectedEngine,
  onSelectEngine,
  onExamplePrompt,
}: {
  isHydrating: boolean;
  isBusy: boolean;
  selectedEngine: EngineKey;
  onSelectEngine: (key: EngineKey) => void;
  onExamplePrompt: (prompt: string) => void;
}) {
  const [expandedEngine, setExpandedEngine] = useState<EngineKey>(selectedEngine);

  useEffect(() => {
    setExpandedEngine(selectedEngine);
  }, [selectedEngine]);

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

  return (
    <div className="mx-auto flex w-full max-w-2xl justify-center px-4 py-2 sm:px-6 sm:py-3">
      <div className="flex w-full flex-col items-center px-2 py-1 text-center sm:px-4 sm:py-2">
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What do you want to build?
          </h2>
          <p className="text-xs leading-5 text-muted-foreground">
            Describe the part in plain language or start with a prompt. You can
            also add reference images, sketches, and technical specs.
          </p>
        </div>

        <div className="mt-4 w-full max-w-2xl">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Engine
            </p>
            <p className="text-[11px] leading-4 text-muted-foreground">
              Expand an engine to see when to use it.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Engine selection"
            className="mt-2 space-y-1.5"
          >
            {ENGINE_KEYS.map((key) => {
              const engine = engines[key];
              const isActive = engine.status;
              const isSelected = key === selectedEngine;
              const isOpen = key === expandedEngine;
              const containerClassName = isSelected
                ? "border-accent/60 bg-accent/5 shadow-sm"
                : isOpen
                  ? "border-border/70 bg-muted/15"
                  : isActive
                    ? "border-border/50 bg-background hover:border-border/80 hover:bg-muted/20"
                    : "border-border/30 bg-muted/10";
              const radioClassName = isSelected
                ? "border-accent bg-accent/10"
                : "border-border/60 bg-background";
              const radioDotClassName = isSelected ? "bg-accent" : "bg-transparent";

              return (
                <div
                  key={key}
                  className={`rounded-lg border text-left transition-colors ${containerClassName}`}
                >
                  <div className="flex items-start gap-1.5 px-2.5 py-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={!isActive}
                      onClick={() => {
                        setExpandedEngine(key);
                        if (isActive) {
                          onSelectEngine(key);
                        }
                      }}
                      className={`flex min-w-0 flex-1 items-start gap-2 text-left ${!isActive ? "opacity-70" : ""}`}
                    >
                      <span
                        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${radioClassName}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${radioDotClassName}`}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-semibold leading-4 text-foreground">
                              {engine.label}
                            </span>
                            <span className="rounded-md border border-border/50 bg-background/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {engine.category}
                            </span>
                            {!isActive && (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                Coming soon
                              </span>
                            )}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`mt-0.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                      </span>
                    </button>
                    <a
                      href={engine.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${engine.label} documentation`}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  {isOpen ? (
                    <div className="border-t border-border/40 px-2.5 py-2 text-left">
                      <p className="text-[11px] leading-4 text-muted-foreground">
                        {engine.description}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          Best for:
                        </span>{" "}
                        {engine.bestFor}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 w-full max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Quick starts
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.label}
                onClick={() => onExamplePrompt(example.prompt)}
                className="rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground transition-[background-color,border-color,color] hover:border-border/70 hover:bg-muted/50 hover:text-foreground"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
