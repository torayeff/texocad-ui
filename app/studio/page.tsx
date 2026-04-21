import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";
import StudioClient from "@/app/studio/_components/StudioClient";

export default async function StudioPage() {
  const { userId, has, sessionClaims } = await auth();

  if (!userId) {
    redirect(SITE_ROUTES.home);
  }

  if (!has({ plan: CLERK_PLAN_SLUG }) && !sessionClaims?.freeAccess) {
    redirect(SITE_ROUTES.pricing);
  }

  return <StudioClient />;
}
