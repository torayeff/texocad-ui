"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SITE_ROUTES } from "@/app/lib/site";

const DISMISS_STORAGE_KEY = "texocad-expert-network-banner-dismissed";

export function ExpertNetworkBanner() {
  const [isVisible, setIsVisible] = useState(() => (
    typeof window === "undefined" || window.localStorage.getItem(DISMISS_STORAGE_KEY) !== "true"
  ));

  function dismissBanner() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="border-b border-border bg-accent/5 px-[var(--app-chrome-gutter)] py-2.5 text-xs font-medium text-foreground/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 pr-8 sm:pr-0">
        <p className="text-center">
          <span>CAD expert? Get paid for product design work.</span>{" "}
          <Link
            href={SITE_ROUTES.expertNetwork}
            className="text-accent transition-colors hover:text-accent/80"
          >
            Apply for paid projects
          </Link>
        </p>
        <button
          type="button"
          className="absolute right-[var(--app-chrome-gutter)] grid size-6 place-items-center rounded-full text-foreground/45 transition-colors hover:bg-accent/10 hover:text-foreground"
          aria-label="Dismiss expert network banner"
          onClick={dismissBanner}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
