import type { Metadata } from "next";
import { Suspense } from "react";

import { SITE_NAME } from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} - Studio`,
  },
  description:
    "Use TexoCAD Studio to generate CAD designs and inspect generated STEP exports.",
  alternates: {
    canonical: "/studio",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense>{children}</Suspense>;
}
