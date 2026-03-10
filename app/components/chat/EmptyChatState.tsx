import React from "react";
import { MessageSquare, Loader2 } from "lucide-react";

export const EXAMPLE_PROMPTS = [
  "A hollow cylinder with a threaded cap",
  "A mounting bracket with 4 screw holes",
  "A standard gear with 20 involute teeth",
  "A phone stand with an adjustable angle",
];

export function EmptyChatState({
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
      <div className="flex min-h-full items-center justify-center gap-2 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading conversation...</span>
      </div>
    );
  }

  if (isBusy) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center text-muted-foreground">
      <MessageSquare size={34} className="opacity-30" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground/90">
          Enter a prompt to generate a 3D model
        </p>
        <p className="text-xs text-muted-foreground">
          Start simple, then refine with follow-up prompts.
        </p>
      </div>
      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onExamplePrompt(prompt)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:bg-accent/5 hover:text-accent transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
