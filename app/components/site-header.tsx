import { Menu } from "lucide-react";

import { TrackedLink } from "@/app/components/analytics/tracked-link";
import { ThemeLogo } from "@/app/components/theme-logo";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { SITE_ROUTES } from "@/app/lib/site";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-[var(--app-chrome-gutter)] py-6 text-sm">
      <div className="flex items-center gap-2">
        <details className="relative sm:hidden">
          <summary
            className="grid size-[1.875rem] list-none place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] text-muted-foreground [&::-webkit-details-marker]:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={18} strokeWidth={2} />
          </summary>
          <div className="absolute left-0 top-10 z-20 flex min-w-36 flex-col gap-1 rounded-xl border border-border bg-background p-2 text-[13px] font-medium text-foreground/70 shadow-[0_8px_30px_rgb(0_0_0_/_0.08)]">
            <TrackedLink
              href={SITE_ROUTES.studio}
              analytics={{
                cta: "studio_nav",
                destination: SITE_ROUTES.studio,
                location: "site_header_mobile",
              }}
              className="px-3 py-2"
            >
              Studio
            </TrackedLink>
            <TrackedLink
              href={SITE_ROUTES.pricing}
              analytics={{
                cta: "pricing_nav",
                destination: SITE_ROUTES.pricing,
                location: "site_header_mobile",
              }}
              className="px-3 py-2"
            >
              Pricing
            </TrackedLink>
            <TrackedLink
              href={SITE_ROUTES.viewer}
              analytics={{
                cta: "viewer_nav",
                destination: SITE_ROUTES.viewer,
                location: "site_header_mobile",
              }}
              className="px-3 py-2"
            >
              Viewer
            </TrackedLink>
          </div>
        </details>

        <TrackedLink
          href={SITE_ROUTES.home}
          analytics={{
            cta: "home_logo",
            destination: SITE_ROUTES.home,
            location: "site_header",
          }}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
          aria-label="TexoCAD home"
        >
          <ThemeLogo alt="" width={22} height={22} priority />
          <span>TexoCAD</span>
        </TrackedLink>
      </div>

      <nav
        className="hidden items-center gap-8 text-[13px] font-medium text-foreground/70 sm:flex"
        aria-label="Primary navigation"
      >
        <TrackedLink
          href={SITE_ROUTES.studio}
          analytics={{
            cta: "studio_nav",
            destination: SITE_ROUTES.studio,
            location: "site_header",
          }}
          className="transition-colors hover:text-foreground"
        >
          Studio
        </TrackedLink>
        <TrackedLink
          href={SITE_ROUTES.pricing}
          analytics={{
            cta: "pricing_nav",
            destination: SITE_ROUTES.pricing,
            location: "site_header",
          }}
          className="transition-colors hover:text-foreground"
        >
          Pricing
        </TrackedLink>
        <TrackedLink
          href={SITE_ROUTES.viewer}
          analytics={{
            cta: "viewer_nav",
            destination: SITE_ROUTES.viewer,
            location: "site_header",
          }}
          className="transition-colors hover:text-foreground"
        >
          Viewer
        </TrackedLink>
        <ThemeToggle />
      </nav>

      <div className="sm:hidden">
        <ThemeToggle />
      </div>
    </header>
  );
}
