import type { Metadata } from "next";
import {
  MessageSquare,
  Image as ImageIcon,
  Box,
  Zap,
  FileDown,
  RefreshCcw,
  Terminal,
  Play,
  Cog,
  Grid3x3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import {
  SITE_DESCRIPTION,
  SITE_ROUTES,
  SITE_TITLE,
  SITE_URL,
  absoluteSiteUrl,
  getShowcaseItemPath,
} from "@/app/lib/site";
import { getAllShowcaseItems } from "@/app/showcase/_lib/showcase";

const FEATURES = [
  {
    title: "Natural language",
    description: "Describe the part you want in natural language.",
    icon: MessageSquare,
  },
  {
    title: "Visual inputs",
    description: "Guide the model with sketches or drawings.",
    icon: ImageIcon,
  },
  {
    title: "Parametric output",
    description: "Get editable BREP CAD, not static geometry.",
    icon: Box,
  },
  {
    title: "Rapid prototyping",
    description: "Move from rough ideas to editable prototype geometry quickly.",
    icon: Zap,
  },
  {
    title: "Universal export",
    description: "Export STEP or STL for downstream workflows.",
    icon: FileDown,
  },
  {
    title: "Iterative design",
    description: "Refine the design with natural-language edits.",
    icon: RefreshCcw,
  },
];

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_ROUTES.home,
  },
};

export default async function Home() {
  const items = await getAllShowcaseItems();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#webpage`,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    url: absoluteSiteUrl(SITE_ROUTES.home),
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    mainEntity: {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#showcase-list`,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteSiteUrl(getShowcaseItemPath(item.thread_id)),
        name: item.name,
      })),
    },
  };

  return (
    <>
      <script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-dvh md:h-dvh flex flex-col text-foreground bg-background">
        <Header />

        <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden min-h-0">
          <section className="flex-1 flex flex-col relative min-h-[500px] md:min-h-0">
            <div
              className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                backgroundPosition: "center center",
              }}
            />

            <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-16 z-10 md:overflow-y-auto">
              <div className="w-full max-w-3xl mx-auto flex flex-col justify-center flex-1 py-12 md:py-0 min-h-full">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-1 text-xs font-mono text-muted-foreground mb-6">
                    <Terminal size={12} />
                    <span>Agentic Text-to-CAD</span>
                  </div>

                  <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl leading-[1.05] mb-4">
                    Unlock physical product building
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
                    For builders of physical products, TexoCAD turns ideas,
                    requirements, and sketches into editable CAD with natural
                    language, enabling rapid prototyping and fast iteration.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-10">
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                  >
                    <Cog size={16} strokeWidth={2} />
                    Start Building
                  </Link>

                  <a
                    href="https://www.youtube.com/watch?v=EIbIrcWQtNw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Play size={15} strokeWidth={1.5} />
                    Watch Demo
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="flex items-start gap-2.5"
                      >
                        <Icon
                          size={15}
                          strokeWidth={1.5}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {feature.title}
                          </div>
                          <div className="text-[13px] leading-snug text-muted-foreground">
                            {feature.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="md:w-[480px] border-t md:border-t-0 md:border-l border-border bg-muted/20 flex flex-col shrink-0">
            <div className="p-3 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2 shrink-0">
              <Grid3x3 size={14} />
              Showcase: Built with TexoCAD
            </div>
            <div className="p-2 grid grid-cols-3 md:grid-rows-4 gap-2 flex-1">
              {items.map((item) => (
                <Link
                  key={item.thread_id}
                  href={getShowcaseItemPath(item.thread_id)}
                  className="group relative aspect-square md:aspect-auto overflow-hidden rounded-lg border border-border/50 bg-muted/30 transition-all hover:border-border hover:shadow-sm"
                >
                  <Image
                    src={`/showcase/images/${item.thread_id}.jpg`}
                    alt={item.name}
                    fill
                    sizes="192px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                    <span className="text-[11px] font-medium leading-tight text-white line-clamp-2">
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
        <Footer />
      </main>
    </>
  );
}
