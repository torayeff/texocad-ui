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
    label: "Headphone stand",
    prompt:
      "Design a desktop headphone stand with a circular base 120 mm in diameter, a vertical stem 220 mm tall, and a curved top cradle 45 mm wide for over-ear headphones. Add soft 8 mm edge fillets and a cable hook on the back.",
  },
  {
    label: "Keyboard case",
    prompt:
      "Create a compact mechanical keyboard case for a 65% layout with a 320 mm by 110 mm footprint, 18 mm front height, a 6 degree typing angle, USB-C cutout on the rear, and internal mounting posts for a tray-mount PCB.",
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
