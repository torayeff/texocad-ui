"use client";

import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";

type WaitlistStatus = "idle" | "submitting" | "success";

interface ClerkErrorItem {
  longMessage?: string;
  message?: string;
}

interface ClerkErrorShape {
  errors?: ClerkErrorItem[];
  message?: string;
}

interface WaitlistClerk {
  joinWaitlist(params: { emailAddress: string }): Promise<unknown>;
  openSignIn(): void;
}

const FEATURES = [
  "Natural-language CAD",
  "Sketch and drawing input",
  "Multi-engine workflows",
  "Parametric BREP models",
  "Manufacturability checks",
  "Multi-format exports",
] as const;

const noopSubscribe = () => () => { };

const backgroundGridStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "64px 64px",
  maskImage: "radial-gradient(circle at center, black 34%, transparent 86%)",
};

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "Something went wrong. Please try again.";
  }

  const clerkError = error as ClerkErrorShape;
  const firstError = clerkError.errors?.[0];

  if (firstError?.longMessage) {
    return firstError.longMessage;
  }

  if (firstError?.message) {
    return firstError.message;
  }

  if (clerkError.message) {
    return clerkError.message;
  }

  return "Something went wrong. Please try again.";
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk() as ReturnType<typeof useClerk> & WaitlistClerk;
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isDark = mounted && resolvedTheme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      await clerk.joinWaitlist({
        emailAddress: normalizedEmail,
      });
      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleSignIn = () => {
    clerk.openSignIn();
  };

  return (
    <main className="relative isolate min-h-dvh overflow-y-auto bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.26]" style={backgroundGridStyle} />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-muted/50 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Go to home page"
            className="inline-flex transition-opacity hover:opacity-80"
          >
            <Image
              src={isDark ? "/logo-white.png" : "/logo-black.png"}
              alt="TEXOCAD"
              width={28}
              height={28}
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            {isSignedIn ? <UserButton /> : null}

            <button
              type="button"
              onClick={handleThemeToggle}
              disabled={!mounted}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex rounded-full p-2 text-muted-foreground/70 transition-colors hover:bg-muted/70 hover:text-muted-foreground disabled:opacity-50"
            >
              <ThemeIcon size={16} />
            </button>
          </div>
        </header>

        <section className="flex flex-1 items-center py-14 sm:py-20">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,24rem)] lg:items-center">
            <div className="max-w-3xl">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                Agentic Text-to-CAD for production-ready parts.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Turn natural language requirements, sketches, and engineering drawings into
                manufacturable CAD, refine designs with AI agents, catch issues
                early, and export STEP and STL files.
              </p>

              <div className="mt-8 grid max-w-2xl gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                {FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 shadow-sm shadow-black/5 backdrop-blur-sm"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-[13px] font-medium text-foreground/85">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-black/5 sm:p-8">
              <p className="text-sm font-medium text-muted-foreground">Join the waitlist</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                Get early access
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Be first to try text-to-CAD workflows built for
                production-ready parts.
              </p>

              {status === "success" ? (
                <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 text-success" size={20} />
                    <div>
                      <p className="font-medium text-foreground">
                        You&apos;re on the list.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        We&apos;ll reach out as soon as early access opens up for
                        your account.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">
                      Work email
                    </span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Joining..." : "Join waitlist"}
                    <ArrowRight size={18} />
                  </button>

                  {errorMessage ? (
                    <p className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                      {errorMessage}
                    </p>
                  ) : null}
                </form>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Already have access?
                </p>

                <div className="flex items-center gap-3">
                  {isSignedIn ? (
                    <Link
                      href="/studio"
                      className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent"
                    >
                      Open the studio
                    </Link>
                  ) : null}
                  {!isSignedIn ? (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent"
                    >
                      Sign in
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
