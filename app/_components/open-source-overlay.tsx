import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

import { TrackedAnchor } from "@/app/components/analytics/tracked-link";
import { BACKEND_SOURCE_CODE_URL, SOURCE_CODE_URL } from "@/app/lib/site";

const repositories = [
  { label: "UI repository", href: SOURCE_CODE_URL, cta: "github_ui" },
  { label: "Backend repository", href: BACKEND_SOURCE_CODE_URL, cta: "github_backend" },
] as const;

export function OpenSourceOverlay() {
  return (
    <main
      aria-labelledby="open-source-heading"
      className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-background/55 p-6 text-foreground backdrop-blur-[3px] sm:p-10"
    >
      <div className="m-auto w-full max-w-lg rounded-3xl border border-border/80 bg-background/90 p-7 text-center shadow-[0_24px_80px_rgb(0_0_0_/_0.12)] sm:p-10">
        <div className="mx-auto mb-6 grid size-12 place-items-center rounded-2xl border border-border bg-muted/60">
          <FaGithub size={24} aria-hidden="true" />
        </div>
        <h1
          id="open-source-heading"
          className="text-balance text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl"
        >
          TexoCAD is open source
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
          Explore the code, make it your own, and keep building.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {repositories.map(({ label, href, cta }) => (
            <TrackedAnchor
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              analytics={{ cta, destination: href, location: "homepage_open_source_overlay" }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {label}
              <ArrowUpRight size={16} aria-hidden="true" />
            </TrackedAnchor>
          ))}
        </div>
      </div>
    </main>
  );
}
