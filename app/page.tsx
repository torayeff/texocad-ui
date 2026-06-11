import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

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

const AGENTS = [
  {
    name: "Clari",
    role: "Requirements engineer",
    description:
      "Drafts clear, engineering-ready briefs with scope, deliverables, and acceptance criteria.",
    href: "#",
    image: "/images/agents/clari.png",
  },
  {
    name: "Lumi",
    role: "Concept engineer",
    description:
      "Shapes rough ideas and sketches into visual concepts, 3D models, and early design directions.",
    href: SITE_ROUTES.lumi,
    image: "/images/agents/lumi.png",
  },
  {
    name: "Forma",
    role: "CAD engineer",
    description:
      "Converts concepts into precise, editable CAD designs, assemblies, and manufacturable parts.",
    href: SITE_ROUTES.forma,
    image: "/images/agents/forma.png",
  },
  {
    name: "Nexis",
    role: "Simulation engineer",
    description:
      "Prepares and runs simulations to test performance, feasibility, stress, motion, and behavior.",
    href: "#",
    image: "/images/agents/nexis.png",
  },
] as const;

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

        <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-8 sm:px-10 lg:min-h-0 lg:grid-cols-[0.72fr_1fr] lg:grid-rows-[minmax(0,1fr)] lg:px-12 lg:py-4">
          <div className="max-w-xl lg:self-center">
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Turn your imagination into real products.
            </h1>
            <p className="mt-6 text-lg leading-7 text-muted-foreground sm:text-xl">
              AI agents take your idea from brief to 3D concept, CAD, and
              simulation.
            </p>
          </div>

          <div className="relative lg:min-h-0 lg:self-stretch">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto aspect-square w-3/4 max-w-full -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgb(45_212_191_/_0.09),transparent_62%)]"
            />
            <HeroPointCloud />
          </div>
        </section>

        <section
          aria-labelledby="agents-heading"
          className="mx-auto w-full max-w-7xl px-6 pb-10 sm:px-10 lg:px-12 lg:pb-5"
        >
          <div className="flex items-center gap-4">
            <h2
              id="agents-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Meet the agents
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent) => (
              <Link
                key={agent.name}
                href={agent.href}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={agent.image}
                    alt={`${agent.name}, ${agent.role} agent`}
                    width={96}
                    height={96}
                    className="size-12 shrink-0 rounded-full object-cover ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-tight">
                      {agent.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {agent.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-auto flex w-full max-w-7xl justify-center gap-6 px-[var(--app-chrome-gutter)] pb-6 text-xs font-normal text-foreground/35 sm:justify-end lg:pb-5">
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
