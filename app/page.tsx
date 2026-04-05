"use client";

import {
  MessageSquare,
  Image as ImageIcon,
  Box,
  Zap,
  FileDown,
  RefreshCcw,
  Terminal,
  LifeBuoy,
  Play,
  Cog
} from "lucide-react";
import Link from "next/link";

import { Header } from "@/app/components/Header";

const FEATURES = [
  {
    title: "Natural language",
    description: "Describe the part you want in natural language.",
    icon: MessageSquare,
  },
  {
    title: "Visual inputs",
    description: "Guide the model with sketches or drawings.",
    icon: ImageIcon,
  },
  {
    title: "Parametric output",
    description: "Get editable BREP CAD, not static geometry.",
    icon: Box,
  },
  {
    title: "Rapid prototyping",
    description: "Move from rough ideas to editable prototype geometry quickly.",
    icon: Zap,
  },
  {
    title: "Universal export",
    description: "Export STEP or STL for downstream workflows.",
    icon: FileDown,
  },
  {
    title: "Iterative design",
    description: "Refine the design with natural-language edits.",
    icon: RefreshCcw,
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh md:h-dvh flex flex-col text-foreground bg-background">
      <Header />

      {/* Workspace */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        {/* Agent Canvas */}
        <section className="flex-1 flex flex-col relative min-h-[500px] md:min-h-0">
          {/* Subtle background pattern (mimicking grid) */}
          <div
            className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              backgroundPosition: "center center",
            }}
          />

          <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-16 z-10 md:overflow-y-auto">
            <div className="w-full max-w-3xl mx-auto flex flex-col justify-center flex-1 py-12 md:py-0 min-h-full">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-1 text-xs font-mono text-muted-foreground mb-6">
                  <Terminal size={12} />
                  <span>Agentic Text-to-CAD</span>
                </div>

                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl leading-[1.05] mb-4">
                  Unlock physical product building
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
                  For builders of physical products, TexoCAD turns ideas, requirements, and sketches into editable CAD with natural language, enabling rapid prototyping and fast iteration.
                </p>
              </div>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Cog size={16} strokeWidth={2} />
                  Start Building
                </Link>

                <a
                  href="https://www.youtube.com/watch?v=EIbIrcWQtNw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Play size={15} strokeWidth={1.5} />
                  Watch Demo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Palette */}
        <aside className="md:w-72 border-t md:border-t-0 md:border-l border-border md:overflow-y-auto bg-muted/20 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2 shrink-0">
            <Box size={14} />
            Properties
          </div>
          <div className="p-3 flex flex-col gap-2 flex-1">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group flex flex-col gap-1.5 cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/60 border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Icon size={16} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    <h3 className="text-sm font-medium tracking-tight">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground pl-6">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-border/50 mt-auto flex justify-center">
            <a
              href="mailto:support@texocad.ai"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LifeBuoy size={16} />
              <span>Support</span>
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
