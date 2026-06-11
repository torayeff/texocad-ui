"use client";

import Image from "next/image";
import { useState } from "react";

import { AgentProfileDialog } from "@/app/_components/agent-profile-dialog";
import { AGENT_PROFILES, type AgentProfile } from "@/app/_lib/agent-profiles";

export function AgentProfileGrid() {
  const [activeAgent, setActiveAgent] = useState<AgentProfile | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENT_PROFILES.map((agent) => (
          <button
            key={agent.name}
            type="button"
            onClick={() => setActiveAgent(agent)}
            aria-haspopup="dialog"
            className="group grid h-[16.5rem] grid-rows-[3.75rem_3.75rem_2rem_2rem] gap-y-4 rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-4">
              <Image
                src={agent.image}
                alt=""
                width={120}
                height={120}
                className="size-[3.75rem] shrink-0 rounded-full object-cover ring-1 ring-border"
              />
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-tight">
                  {agent.name}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {agent.role}
                </span>
              </span>
            </span>

            <span className="overflow-hidden text-[13px] leading-5 text-muted-foreground">
              {agent.tagline}
            </span>

            <span className="flex flex-wrap content-start gap-1.5">
              {agent.cardSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </span>

            <span className="flex items-center justify-center rounded-lg text-[13px] font-medium text-foreground/80 transition-colors group-hover:bg-muted/60 group-hover:text-foreground">
              View profile
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
