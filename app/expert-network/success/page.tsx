import type { Metadata } from "next";
import Link from "next/link";

import { ThemeLogo } from "@/app/components/theme-logo";
import { SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Application Received",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExpertNetworkSuccessPage() {
  return (
    <main className="flex min-h-[var(--app-viewport-height)] items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-[0_24px_80px_rgb(0_0_0_/_0.08)] sm:p-10">
        <Link
          href={SITE_ROUTES.home}
          className="mx-auto mb-8 inline-flex items-center gap-2 text-xl font-semibold tracking-tight"
          aria-label="TexoCAD home"
        >
          <ThemeLogo alt="" width={24} height={24} priority />
          <span>TexoCAD</span>
        </Link>

        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-success/10 text-2xl text-success">
          ✓
        </div>

        <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Application received.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          Thanks for applying to join the TexoCAD Expert Network. We&apos;ll
          review your details and follow up with the next steps soon.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={SITE_ROUTES.home}
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Back to Home
          </Link>
          <Link
            href={SITE_ROUTES.studio}
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Open Studio
          </Link>
        </div>
      </section>
    </main>
  );
}
