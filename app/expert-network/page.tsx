import type { Metadata } from "next";

import { SiteHeader } from "@/app/_components/site-header";
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
    <main className="flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <SiteHeader />
      <iframe
        src={TALLY_FORM_URL}
        title="Join the TexoCAD Expert Network"
        width="100%"
        height="100%"
        className="min-h-0 flex-1 border-0"
      />
    </main>
  );
}
