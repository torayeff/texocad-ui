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
      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={`/showcase/images/${threadId}.jpg`}
            alt={name}
            fill
            sizes="(min-width: 768px) 38vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="px-4 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Prompt
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {prompt}
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href={`/studio?thread_id=${threadId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Cog size={15} strokeWidth={2} />
              Start Building
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
