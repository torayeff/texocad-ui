"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import type { AgentProfile } from "@/app/_lib/agent-profiles";
import { TrackedLink } from "@/app/components/analytics/tracked-link";
import { trackEvent } from "@/app/lib/analytics/client";
import { cn } from "@/app/lib/cn";

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const primaryActionClass =
  "inline-flex h-10 min-w-36 items-center justify-center rounded-[0.625rem] bg-foreground px-5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90";

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold tracking-tight">{children}</h3>;
}

export function AgentProfileDialog({
  agent,
  onClose,
}: {
  agent: AgentProfile;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const isAvailable = agent.startHref !== null;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
        [],
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === firstElement || activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-profile-title"
        className="relative max-h-full w-[min(31rem,100%)] overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-[0_24px_80px_rgb(0_0_0_/_0.18)] outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={16} strokeWidth={1.8} />
        </button>

        <div className="flex flex-col gap-5 sm:flex-row">
          <Image
            src={agent.image}
            alt=""
            width={224}
            height={224}
            className="size-24 shrink-0 rounded-full object-cover ring-1 ring-border sm:size-28"
          />
          <div className="min-w-0 pr-6">
            <h2
              id="agent-profile-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {agent.name}
            </h2>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {agent.role}
            </p>
            <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
              {agent.bio}
            </p>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                isAvailable
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  isAvailable ? "bg-success" : "bg-muted-foreground/60",
                )}
              />
              {isAvailable ? "Available now" : "Coming soon"}
            </span>
          </div>
        </div>

        <section className="mt-6 border-t border-border/70 pt-5">
          <SectionTitle>Core skills</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {agent.coreSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/75"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-2 sm:gap-8">
          <section>
            <SectionTitle>Best for</SectionTitle>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-muted-foreground">
              {agent.bestFor.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4375rem] size-1 shrink-0 rounded-full bg-muted-foreground/55"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <SectionTitle>Outputs</SectionTitle>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-muted-foreground">
              {agent.outputs.map((output) => (
                <li key={output} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4375rem] size-1 shrink-0 rounded-full bg-muted-foreground/55"
                  />
                  {output}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {agent.startHref !== null ? (
            <TrackedLink
              href={agent.startHref}
              analytics={{
                cta: "work_with_agent",
                destination: agent.startHref,
                location: "agent_profile_dialog",
              }}
              onClick={() => {
                trackEvent("agent_profile_cta_clicked", {
                  agent_name: agent.name,
                  destination: agent.startHref ?? undefined,
                  is_available: true,
                });
              }}
              className={primaryActionClass}
            >
              Work with {agent.name}
            </TrackedLink>
          ) : (
            <button
              type="button"
              disabled
              className={cn(primaryActionClass, "opacity-45")}
            >
              Work with {agent.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
