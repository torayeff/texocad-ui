import Link from "next/link";

import { SITE_ROUTES } from "@/app/lib/site";

export function ExpertNetworkBanner() {
  return (
    <div className="border-b border-border bg-accent/[0.03] px-[var(--app-chrome-gutter)] py-2.5 text-xs font-medium text-foreground/70">
      <p className="mx-auto w-full max-w-7xl text-center">
        <span>Are you a human expert? Get paid for product design work.</span>{" "}
        <Link
          href={SITE_ROUTES.humanExpertsNetwork}
          className="text-accent transition-colors hover:text-accent/80"
        >
          Join the Expert Network
        </Link>
      </p>
    </div>
  );
}
