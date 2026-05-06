import { Loader2 } from "lucide-react";

const EXAMPLE_PROMPTS = [
  {
    label: "Spacer",
    prompt:
      "Create a flanged spacer with a 12 mm through-hole, 22 mm outer diameter barrel that is 14 mm long, and a 36 mm diameter flange that is 3 mm thick on one end.",
  },
  {
    label: "L-bracket",
    prompt:
      "Design an L-shaped bracket with 80 mm and 60 mm legs, 4 mm wall thickness, and two 6 mm mounting holes on the base leg.",
  },
  {
    label: "Washer",
    prompt:
      "Create a flat washer with a 6 mm inner hole, 14 mm outer diameter, and 1.5 mm thickness. Add 0.3 mm chamfers on both faces.",
  },
  {
    label: "Pen holder",
    prompt:
      "Create a cylindrical pen holder with a 40 mm outer diameter, 34 mm inner diameter, and 100 mm height with a 4 mm thick base.",
  },
  {
    label: "Box with lid",
    prompt:
      "Create a simple rectangular box 80 mm long, 60 mm wide, and 30 mm tall with 2 mm thick walls and a matching flat lid.",
  },
  {
    label: "Knob",
    prompt:
      "Create a round knob with a 30 mm diameter head, 12 mm tall, a flat top, and a 6 mm diameter, 10 mm long shaft on the bottom.",
  },
];

export default function EmptyChatState({
  isHydrating,
  isBusy,
  onExamplePrompt,
}: {
  isHydrating: boolean;
  isBusy: boolean;
  onExamplePrompt: (prompt: string) => void;
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
