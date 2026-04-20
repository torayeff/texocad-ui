import type { ReactNode } from "react";

import { Footer } from "@/app/components/Footer";
import { Header } from "@/app/components/Header";

interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  summary: ReactNode;
  tableOfContents?: readonly LegalTocItem[];
  children: ReactNode;
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalDocument({
  title,
  lastUpdated,
  summary,
  tableOfContents,
  children,
}: LegalDocumentProps) {
  return (
    <main className="min-h-dvh md:h-dvh flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 overflow-y-auto min-h-0">
        <article className="mx-auto w-full max-w-5xl px-6 py-10 md:px-8 md:py-14">
          <header className="rounded-2xl border border-border bg-muted/20 p-6 md:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
            <div className="mt-5 space-y-3 text-base leading-7 text-muted-foreground">
              {summary}
            </div>
            {tableOfContents?.length ? (
              <nav
                aria-label="Table of contents"
                className="mt-6 rounded-xl border border-border/70 bg-background/80 p-4"
              >
                <p className="text-sm font-medium text-foreground">On this page</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </header>
          <div className="prose-legal mt-10">{children}</div>
        </article>
      </div>
      <Footer />
    </main>
  );
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
