import type { Metadata } from "next";

import { ThemeLogo } from "@/app/components/theme-logo";
import { SITE_NAME, SUPPORT_EMAIL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Maintenance",
  description: `${SITE_NAME} is temporarily unavailable while maintenance is in progress.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[var(--app-viewport-height)] items-center justify-center bg-background px-6 text-foreground">
      <section className="mx-auto flex max-w-md flex-col items-center text-center">
        <ThemeLogo alt="" width={36} height={36} priority />
        <p className="mt-6 text-sm font-medium text-muted-foreground">
          Scheduled maintenance
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          We&rsquo;ll be back shortly.
        </h1>
        <p className="mt-5 text-pretty text-base leading-7 text-muted-foreground">
          {SITE_NAME} is temporarily unavailable while we make a few updates.
          Please check back soon.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-8 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Contact support
        </a>
      </section>
    </main>
  );
}
