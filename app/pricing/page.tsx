import { auth } from "@clerk/nextjs/server";
import { PricingTable } from "@clerk/nextjs";
import Link from "next/link";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

import { TrackOnMount } from "@/app/components/analytics/track-on-mount";
import { TrackedLink } from "@/app/components/analytics/tracked-link";
import { SiteHeader } from "@/app/components/site-header";
import { SITE_ROUTES, SUPPORT_EMAIL } from "@/app/lib/site";
import { PricingAnalyticsBoundary } from "@/app/pricing/_components/pricing-analytics-boundary";

export default async function PricingPage() {
  const { userId, sessionClaims } = await auth();
  const hasGrantedAccess =
    !!userId &&
    (sessionClaims?.freeAccess === true || sessionClaims?.vipAccess === true);
  const accessState = !userId
    ? "anonymous"
    : hasGrantedAccess
      ? "trial_or_vip"
      : "signed_in_no_access";

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground overflow-hidden">
      <TrackOnMount
        eventName="pricing_viewed"
        properties={{ access_state: accessState }}
      />
      <SiteHeader />
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-8">
          <div className="w-full max-w-md flex flex-col items-center">
            <h1 className="mb-4 text-center text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Unlock your AI product team
            </h1>
            {hasGrantedAccess ? (
              <>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  You already have unlimited access to TexoCAD Studio. Jump back in and
                  keep turning ideas into CAD-ready designs.
                </p>
                <TrackedLink
                  href={SITE_ROUTES.studio}
                  analytics={{
                    cta: "go_to_studio",
                    destination: SITE_ROUTES.studio,
                    location: "pricing_access_granted",
                  }}
                  className="inline-flex items-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  Go to Studio
                </TrackedLink>
              </>
            ) : (
              <>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.09] px-4 py-2 text-sm font-semibold text-emerald-700 shadow-[0_12px_32px_rgb(0_0_0_/_0.08)] dark:text-emerald-300">
                  <span
                    className="size-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgb(16_185_129_/_0.55)]"
                    aria-hidden="true"
                  />
                  100% free trial, no credit card required
                </div>
                <div className="w-full">
                  <PricingAnalyticsBoundary accessState={accessState}>
                    <PricingTable />
                  </PricingAnalyticsBoundary>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
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
  );
}
