import type { Metadata } from "next";
import { Menu } from "lucide-react";
import Link from "next/link";

import { ThemeHeroImage } from "@/app/_components/theme-hero-image";
import { ThemeLogo } from "@/app/components/theme-logo";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  SITE_DESCRIPTION,
  SITE_ROUTES,
  SITE_TITLE,
  SITE_URL,
  SUPPORT_EMAIL,
  absoluteSiteUrl,
} from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_ROUTES.home,
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    url: absoluteSiteUrl(SITE_ROUTES.home),
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
  };

  return (
    <>
      <script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex min-h-dvh flex-col bg-background text-foreground">
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
                <Link href={SITE_ROUTES.studio} className="px-3 py-2">
                  Studio
                </Link>
                <Link href={SITE_ROUTES.pricing} className="px-3 py-2">
                  Pricing
                </Link>
                <Link href={SITE_ROUTES.viewer} className="px-3 py-2">
                  Viewer
                </Link>
              </div>
            </details>

            <Link
              href={SITE_ROUTES.home}
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
              aria-label="TexoCAD home"
            >
              <ThemeLogo alt="" width={22} height={22} priority />
              <span>TexoCAD</span>
            </Link>
          </div>

          <nav
            className="hidden items-center gap-8 text-[13px] font-medium text-foreground/70 sm:flex"
            aria-label="Primary navigation"
          >
            <Link
              href={SITE_ROUTES.studio}
              className="transition-colors hover:text-foreground"
            >
              Studio
            </Link>
            <Link
              href={SITE_ROUTES.pricing}
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href={SITE_ROUTES.viewer}
              className="transition-colors hover:text-foreground"
            >
              Viewer
            </Link>
            <ThemeToggle />
          </nav>

          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[0.72fr_1fr] lg:px-12 lg:py-16">
          <div className="max-w-xl">
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Turn ideas into physical products.
            </h1>
            <p className="mt-5 text-lg leading-7 text-muted-foreground sm:text-xl">
              Generate sketches, 3D models, and editable CAD from a text description.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={SITE_ROUTES.studio}
                className="rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Start Building
              </Link>
              <a
                href="https://www.youtube.com/watch?v=EIbIrcWQtNw"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Watch Demo
              </a>
            </div>

            <div className="mt-8 max-w-lg rounded-2xl border border-border bg-card p-4 shadow-[0_18px_55px_rgb(0_0_0_/_0.04)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
                    Are you a CAD expert?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Join TexoCAD&apos;s expert network for paid CAD project work.
                  </p>
                </div>
                <Link
                  href={SITE_ROUTES.expertNetwork}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/5 px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  Apply to Join
                </Link>
              </div>
            </div>
          </div>

          <div className="relative">
            <ThemeHeroImage />
          </div>
        </section>

        <footer className="mx-auto flex w-full max-w-7xl justify-center gap-6 px-[var(--app-chrome-gutter)] pb-8 text-xs font-normal text-foreground/35 sm:justify-end">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="transition-colors hover:text-foreground/60"
          >
            Support
          </a>
          <Link
            href={SITE_ROUTES.privacy}
            className="transition-colors hover:text-foreground/60"
          >
            Privacy Policy
          </Link>
          <Link
            href={SITE_ROUTES.terms}
            className="transition-colors hover:text-foreground/60"
          >
            Terms & Conditions
          </Link>
        </footer>
      </main>
    </>
  );
}
