import type { Metadata } from "next";

import { SITE_NAME, SITE_ROUTES } from "@/app/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description:
    "How TexoCAD collects, uses, stores, shares, and protects personal data when you use TexoCAD.",
  alternates: {
    canonical: SITE_ROUTES.privacy,
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
