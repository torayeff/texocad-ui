import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Header } from "@/app/components/header";
import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import { LUMI_ASSISTANT_ID } from "@/app/lib/chat/langgraph-config";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Lumi AI - 3D modeler, designer, and engineer",
  description:
    "Describe an idea and Lumi turns it into a preview sketch and a 3D-printable model.",
  alternates: {
    canonical: SITE_ROUTES.lumi,
  },
};

const lumiStudioUrl = `${SITE_ROUTES.studio}?${AGENT_QUERY_PARAM}=${LUMI_ASSISTANT_ID}`;

export default async function LumiPage() {
  const { userId, has, sessionClaims } = await auth();

  if (!userId) {
    redirect(SITE_ROUTES.home);
  }

  const hasGrant = sessionClaims?.freeAccess === true || sessionClaims?.vipAccess === true;
  if (!has({ plan: CLERK_PLAN_SLUG }) && !hasGrant) {
    redirect(SITE_ROUTES.pricing);
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <Header />

      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 sm:flex-row sm:gap-14">
          <Image
            src="/images/lumi/lumi.png"
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
              Your personal 3D modeler, designer, and engineer. Tell Lumi what
              you&apos;re imagining and it sketches the concept, brings it to
              life as a 3D model, and refines every detail with you until
              it&apos;s exactly right.
            </p>
            <Link
              href={lumiStudioUrl}
              className="mt-7 inline-flex h-10 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Design with Lumi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
