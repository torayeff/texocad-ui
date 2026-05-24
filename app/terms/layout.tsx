import type { Metadata } from "next";

import { SITE_NAME, SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} - Terms & Conditions`,
  },
  description:
    "The terms governing access to and use of TexoCAD, including subscriptions, AI outputs, and customer content.",
  alternates: {
    canonical: SITE_ROUTES.terms,
  },
};

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
