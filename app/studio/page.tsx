import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";
import StudioClient from "@/app/studio/_components/studio-client";

export default async function StudioPage() {
  const { userId, has, sessionClaims } = await auth();

  if (!userId) {
    redirect(SITE_ROUTES.home);
  }

  const hasGrant = sessionClaims?.freeAccess === true || sessionClaims?.vipAccess === true;
  if (!has({ plan: CLERK_PLAN_SLUG }) && !hasGrant) {
    redirect(SITE_ROUTES.pricing);
  }

  return <StudioClient />;
}
