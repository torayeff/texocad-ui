import type { Metadata } from "next";
import { Suspense } from "react";

import { SITE_NAME, SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `Studio | ${SITE_NAME}`,
  },
  description:
    "Use TexoCAD Studio to generate editable CAD from natural-language prompts and visual inputs.",
  alternates: {
    canonical: SITE_ROUTES.studio,
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
