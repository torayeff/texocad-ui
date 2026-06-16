"use client";

import Image from "next/image";

import { AgentSelectionList } from "@/app/components/chat/agent-selection-list";
import { agentConfigForMode } from "@/app/lib/chat/agent-config";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";

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

  const activeAgent = activeMode ? agentConfigForMode(activeMode) : null;

  if (activeAgent?.greeting) {
    const greeting = activeAgent.greeting;

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

  if (activeAgent?.examples) {
    const examples = activeAgent.examples;
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
