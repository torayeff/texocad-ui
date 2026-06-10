import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";
import LumiClient from "@/app/lumi/_components/lumi-client";

export const metadata: Metadata = {
  title: "Lumi AI - 3D modeler, designer, and engineer",
  description:
    "Describe an idea and Lumi turns it into a preview sketch and a 3D-printable model.",
  alternates: {
    canonical: SITE_ROUTES.lumi,
  },
};

export default async function LumiPage() {
  const { userId, has, sessionClaims } = await auth();

  if (!userId) {
    redirect(SITE_ROUTES.home);
  }

  const hasGrant = sessionClaims?.freeAccess === true || sessionClaims?.vipAccess === true;
  if (!has({ plan: CLERK_PLAN_SLUG }) && !hasGrant) {
    redirect(SITE_ROUTES.pricing);
  }

  return <LumiClient />;
}
