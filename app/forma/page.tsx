import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Header } from "@/app/components/header";
import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import { FORMA_ASSISTANT_ID } from "@/app/lib/chat/langgraph-config";
import { SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Forma AI - Parametric CAD engineer",
  description:
    "Turn requirements into precise parametric CAD for parts and assemblies, with source and STEP exports.",
  alternates: {
    canonical: SITE_ROUTES.forma,
  },
};

const formaStudioUrl = `${SITE_ROUTES.studio}?${AGENT_QUERY_PARAM}=${FORMA_ASSISTANT_ID}`;

export default function FormaPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <Header />

      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 sm:flex-row sm:gap-14">
          <Image
            src="/images/agents/forma.png"
            alt="Forma"
            width={224}
            height={224}
            priority
            className="size-44 shrink-0 rounded-full object-cover shadow-[0_16px_40px_rgb(0_0_0_/_0.14)] ring-1 ring-border/60 sm:size-56"
          />

          <div className="flex max-w-md flex-col items-center text-center sm:items-start sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Meet Forma
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Forma turns requirements into precise parametric CAD for parts and
              assemblies. Describe dimensions, interfaces, constraints, and
              function; Forma builds CAD, exports STEP files, and iterates
              revisions with you.
            </p>
            <Link
              href={formaStudioUrl}
              className="mt-7 inline-flex h-10 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Build CAD with Forma
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
