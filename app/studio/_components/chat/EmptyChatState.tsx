import { Loader2, Sparkles } from "lucide-react";

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
  onExamplePrompt,
}: {
  isHydrating: boolean;
  isBusy: boolean;
  onExamplePrompt: (prompt: string) => void;
}) {
  if (isHydrating) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading conversation...</span>
      </div>
    );
  }

  if (isBusy) {
    return null;
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center text-muted-foreground">
      <Sparkles size={32} className="opacity-30" />
      <div className="space-y-2 max-w-[400px]">
        <p className="text-base font-medium text-foreground/90">
          What do you want to build?
        </p>
        <p className="text-sm text-muted-foreground">
          Describe model, or upload reference images, sketches, and technical specifications.
        </p>
      </div>

      <div className="mt-2 flex max-w-3xl flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example.label}
            onClick={() => onExamplePrompt(example.prompt)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
