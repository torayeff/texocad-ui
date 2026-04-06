import Image from "next/image";
import Link from "next/link";
import { Cog } from "lucide-react";

interface PromptPanelProps {
  name: string;
  prompt: string;
  threadId: string;
}

export default function PromptPanel({ name, prompt, threadId }: PromptPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {name}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Image
          src={`/showcase/images/${threadId}.jpg`}
          alt={name}
          width={800}
          height={600}
          sizes="(min-width: 768px) 38vw, 100vw"
          className="h-auto w-full"
          priority
        />
        <div className="px-4 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Prompt
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {prompt}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3">
        <Link
          href="/studio"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Cog size={15} strokeWidth={2} />
          Start Building
        </Link>
      </div>
    </div>
  );
}
