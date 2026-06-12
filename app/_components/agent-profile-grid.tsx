"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { AgentProfileDialog } from "@/app/_components/agent-profile-dialog";
import { AGENT_PROFILES, type AgentProfile } from "@/app/_lib/agent-profiles";

function getRoleLines(role: string): [string] | [string, string] {
  const [firstWord, ...remainingWords] = role.split(" ");

  if (firstWord === undefined || remainingWords.length === 0) {
    return [role];
  }

  return [firstWord, remainingWords.join(" ")];
}

export function AgentProfileGrid() {
  const [activeAgent, setActiveAgent] = useState<AgentProfile | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {AGENT_PROFILES.map((agent) => (
          <button
            key={agent.name}
            type="button"
            onClick={() => setActiveAgent(agent)}
            aria-haspopup="dialog"
            className="group relative grid h-[10rem] grid-rows-[3.75rem_1fr] gap-y-4 rounded-2xl border border-border bg-card p-6 pr-14 text-left transition-colors hover:bg-muted/40 lg:h-[8rem] lg:grid-rows-[3rem_1fr] lg:gap-y-2.5 lg:rounded-xl lg:p-4 lg:pr-12"
          >
            <span className="flex items-center gap-4 lg:gap-3">
              <Image
                src={agent.image}
                alt=""
                width={120}
                height={120}
                className="size-[3.75rem] shrink-0 rounded-full object-cover ring-1 ring-border lg:size-12"
              />
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-tight lg:text-sm">
                  {agent.name}
                </span>
                <span className="mt-1 block text-[11px] font-medium leading-[1.25] tracking-[0.04em] text-muted-foreground lg:text-[10px]">
                  {getRoleLines(agent.role).map((roleLine) => (
                    <span key={roleLine} className="block">
                      {roleLine}
                    </span>
                  ))}
                </span>
              </span>
            </span>

            <span className="flex flex-wrap content-start gap-1.5 lg:gap-1">
              {agent.cardSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground lg:px-1.5 lg:py-0.5 lg:text-[10px]"
                >
                  {skill}
                </span>
              ))}
            </span>

            <span className="absolute right-6 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:border-foreground/15 group-hover:bg-foreground group-hover:text-background lg:right-4 lg:size-7">
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      {activeAgent !== null ? (
        <AgentProfileDialog
          agent={activeAgent}
          onClose={() => setActiveAgent(null)}
        />
      ) : null}
    </>
  );
}
