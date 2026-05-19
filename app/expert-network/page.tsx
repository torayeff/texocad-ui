import type { Metadata } from "next";
import Script from "next/script";

import { SITE_ROUTES } from "@/app/lib/site";

const TALLY_FORM_URL =
  "https://tally.so/r/EkZGVr?transparentBackground=1&formEventsForwarding=1";

export const metadata: Metadata = {
  title: "Join the TexoCAD Expert Network",
  alternates: {
    canonical: SITE_ROUTES.expertNetwork,
  },
};

export default function ExpertNetworkPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
      <iframe
        data-tally-src={TALLY_FORM_URL}
        title="Join the TexoCAD Expert Network"
        width="100%"
        height="100%"
        className="absolute inset-0 border-0"
      />
    </main>
  );
}
