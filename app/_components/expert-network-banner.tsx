import Link from "next/link";

import { SITE_ROUTES } from "@/app/lib/site";

export function ExpertNetworkBanner() {
  return (
    <div className="border-b border-border bg-accent/5 px-[var(--app-chrome-gutter)] py-2.5 text-xs font-medium text-foreground/70">
      <p className="mx-auto w-full max-w-7xl text-center">
        <span>CAD expert? Get paid for product design work.</span>{" "}
        <Link
          href={SITE_ROUTES.expertNetwork}
          className="text-accent transition-colors hover:text-accent/80"
        >
          Apply for paid projects
        </Link>
      </p>
    </div>
  );
}
