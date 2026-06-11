import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Header } from "@/app/components/header";
import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import { LUMI_ASSISTANT_ID } from "@/app/lib/chat/langgraph-config";
import { SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Lumi AI - 3D modeler for concepts and assets",
  description:
    "Turn ideas into 3D assets from prompts, sketches, or reference images, with image and GLB exports.",
  alternates: {
    canonical: SITE_ROUTES.lumi,
  },
};

const lumiStudioUrl = `${SITE_ROUTES.studio}?${AGENT_QUERY_PARAM}=${LUMI_ASSISTANT_ID}`;

export default function LumiPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <Header />

      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 sm:flex-row sm:gap-14">
          <Image
            src="/images/agents/lumi.png"
            alt="Lumi"
            width={224}
            height={224}
            priority
            className="size-44 shrink-0 rounded-full object-cover shadow-[0_16px_40px_rgb(0_0_0_/_0.14)] ring-1 ring-border/60 sm:size-56"
          />

          <div className="flex max-w-md flex-col items-center text-center sm:items-start sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Meet Lumi
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Lumi turns ideas into 3D assets from prompts, sketches, or
              reference images. Describe the object, style, and level of detail;
              Lumi creates images, exports GLB files, and iterates revisions
              with you.
            </p>
            <Link
              href={lumiStudioUrl}
              className="mt-7 inline-flex h-10 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Model with Lumi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
