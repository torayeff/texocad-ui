import type { Metadata } from "next";
import Link from "next/link";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

import { ExpertNetworkBanner } from "@/app/_components/expert-network-banner";
import { SiteHeader } from "@/app/components/site-header";
import { ThemeHeroImage } from "@/app/_components/theme-hero-image";
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
        <ExpertNetworkBanner />
        <SiteHeader />

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
          <a
            href="https://www.linkedin.com/company/texocad/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/60"
            aria-label="TexoCAD on LinkedIn"
          >
            <FaLinkedin size={14} aria-hidden="true" />
          </a>
          <a
            href="https://x.com/texocad"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/60"
            aria-label="TexoCAD on X"
          >
            <FaXTwitter size={14} aria-hidden="true" />
          </a>
        </footer>
      </main>
    </>
  );
}
