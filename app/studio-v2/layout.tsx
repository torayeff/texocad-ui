import type { Metadata } from "next";
import { Suspense } from "react";

import { SITE_NAME } from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `Studio V2 | ${SITE_NAME}`,
  },
  description:
    "Use TexoCAD Studio V2 to generate CAD designs and inspect generated STEP exports.",
  alternates: {
    canonical: "/studio-v2",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function StudioV2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense>{children}</Suspense>;
}
