"use client";

import {
  UserButton,
  useAuth,
  useClerk
} from "@clerk/nextjs";
import {
  Moon,
  Sun,
  MessageSquare,
  Image as ImageIcon,
  Box,
  ShieldCheck,
  FileDown,
  RefreshCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const FEATURES = [
  {
    title: "Natural language",
    description: "Describe the part you want in plain English.",
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
    title: "Manufacturing ready",
    description: "Catch manufacturing issues before production.",
    icon: ShieldCheck,
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

const noopSubscribe = () => () => { };

export default function Home() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const isDark = mounted && resolvedTheme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleSignIn = () => {
    clerk.openSignIn();
  };

  return (
    <main className="relative min-h-dvh flex flex-col text-foreground selection:bg-foreground/10 overflow-x-hidden">
      <div className="fixed inset-0 z-[-1] h-full w-full bg-background overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            backgroundPosition: "center center",
            maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 10%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 10%, transparent 80%)"
          }}
        />

        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[40%] w-[800px] h-[500px] rounded-full blur-[100px] bg-foreground/5 dark:bg-foreground/[0.07]"
        />
      </div>

      <div className="relative mx-auto flex flex-1 w-full max-w-5xl flex-col px-6 sm:px-8">
        <header className="flex h-16 shrink-0 items-center justify-between">
          <Link
            href="/"
            aria-label="TexoCAD"
            className="transition-opacity hover:opacity-80"
          >
            <Image
              src={isDark ? "/logo-white.png" : "/logo-black.png"}
              alt="TexoCAD"
              width={24}
              height={24}
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            {isSignedIn ? <UserButton /> : null}
            <button
              type="button"
              onClick={handleThemeToggle}
              disabled={!mounted}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ThemeIcon size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col pt-8 pb-20 sm:pt-12 sm:pb-32 lg:pt-8 lg:pb-24 justify-center">
          <section className="flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-4 shadow-sm">
              Agentic text-to-CAD is here
            </div>

            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl leading-[1.05]">
              Unlock physical product building
            </h1>
            <p className="mt-3 max-w-[44rem] text-base text-muted-foreground sm:text-lg leading-7 sm:leading-8">
              For people building physical products, TexoCAD turns ideas, requirements, and sketches into editable, manufacturing-ready CAD with natural language.
            </p>

            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              {isSignedIn ? (
                <Link
                  href="/studio"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Open Studio
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Start Building
                </button>
              )}
            </div>
          </section>

          <section className="mt-10 sm:mt-12 z-10 w-full">
            <div className="grid gap-x-8 gap-y-6 sm:gap-y-8 lg:gap-y-6 mx-auto max-w-5xl sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="group flex flex-col items-center text-center cursor-pointer rounded-2xl p-4 transition-colors duration-300 hover:bg-muted dark:hover:bg-muted/50">
                    <div className="mb-2.5 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-muted/80 text-foreground ring-1 ring-border/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-foreground group-hover:text-background group-hover:ring-foreground group-hover:shadow-md">
                      <Icon size={16} strokeWidth={1.5} className="transition-transform duration-300" />
                    </div>
                    <h3 className="text-sm font-medium tracking-tight text-foreground transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground px-2 transition-colors duration-300 group-hover:text-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
