import { Loader2 } from "lucide-react";

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
      <div className="mx-auto flex min-h-[400px] w-full max-w-2xl items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
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
    <div className="mx-auto flex min-h-[400px] w-full max-w-2xl items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex w-full flex-col items-center px-3 py-6 text-center sm:px-5 sm:py-8">
        <div className="mt-4 max-w-xl space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            What do you want to build?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Describe the part in plain language or start with a prompt. You can
            also add reference images, sketches, and technical specs.
          </p>
        </div>

        <div className="mt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Quick starts
          </p>
          <div className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.label}
                onClick={() => onExamplePrompt(example.prompt)}
                className="rounded-full border border-border/40 bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
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
