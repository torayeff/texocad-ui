import type { Metadata } from "next";
import Link from "next/link";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

import { AgentProfileGrid } from "@/app/_components/agent-profile-grid";
import { ExpertNetworkBanner } from "@/app/_components/expert-network-banner";
import { HeroPointCloud } from "@/app/_components/hero-point-cloud";
import { SiteHeader } from "@/app/components/site-header";
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
      <main className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
        <ExpertNetworkBanner />
        <SiteHeader />

        <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:grid-cols-[0.72fr_1fr] lg:grid-rows-[minmax(0,1fr)] lg:gap-10 lg:px-12 lg:pb-4 lg:pt-6 xl:gap-12">
          <div className="max-w-xl lg:self-center">
            <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[3.4rem] xl:text-[3.75rem]">
              Turn ideas into
              <br />
              real products
            </h1>
            <p className="mt-5 max-w-md text-base leading-6 text-muted-foreground sm:text-lg sm:leading-7 lg:text-base lg:leading-6">
              Create product designs with AI agents and human experts, from
              requirements and concepts to CAD and simulation.
            </p>
            <div className="mt-7 flex">
              <Link
                href={SITE_ROUTES.studio}
                className="inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-[0_16px_40px_rgb(0_0_0_/_0.12)] transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-foreground/90 hover:shadow-[0_20px_48px_rgb(0_0_0_/_0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Start Building
              </Link>
            </div>
          </div>

          <div className="relative lg:min-h-0 lg:self-stretch">
            <HeroPointCloud />
          </div>
        </section>

        <section
          aria-labelledby="agents-heading"
          className="mx-auto w-full max-w-7xl px-6 pb-14 pt-6 sm:px-10 sm:pt-8 lg:px-12 lg:pb-10 lg:pt-4"
        >
          <div className="mb-3 flex items-center gap-4">
            <h2
              id="agents-heading"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Meet the agents
            </h2>
          </div>
          <AgentProfileGrid />
        </section>

        <footer className="mx-auto mt-auto flex w-full max-w-7xl justify-center gap-6 px-[var(--app-chrome-gutter)] pb-6 text-xs font-normal text-foreground/35 sm:justify-end lg:pb-4">
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
