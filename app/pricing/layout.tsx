import type { Metadata } from "next";

import { SITE_NAME, SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} - Pricing`,
  },
  description:
    "Subscribe to TexoCAD to access Studio and generate editable CAD from natural-language prompts.",
  alternates: {
    canonical: SITE_ROUTES.pricing,
  },
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
