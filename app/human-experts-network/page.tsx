import type { Metadata } from "next";
import Script from "next/script";

import { SiteHeader } from "@/app/components/site-header";
import { SITE_ROUTES } from "@/app/lib/site";

const TALLY_FORM_URL =
  "https://tally.so/r/gDOMYP?transparentBackground=1&formEventsForwarding=1";

export const metadata: Metadata = {
  title: "TexoCAD Human Experts Network",
  alternates: {
    canonical: SITE_ROUTES.humanExpertsNetwork,
  },
};

export default function HumanExpertsNetworkPage() {
  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <SiteHeader />
      <iframe
        data-tally-src={TALLY_FORM_URL}
        title="TexoCAD Human Experts Network"
        width="100%"
        height="100%"
        className="min-h-0 flex-1 border-0 bg-transparent"
        style={{ background: "transparent" }}
      />
    </main>
  );
}
