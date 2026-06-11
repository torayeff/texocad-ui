import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import {
  CLARI_ASSISTANT_ID,
  assistantIdFromParam,
} from "@/app/lib/chat/langgraph-config";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";
import StudioClient from "@/app/studio/_components/studio-client";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const agentParam = params[AGENT_QUERY_PARAM];
  const requestedAgent = assistantIdFromParam(
    typeof agentParam === "string" ? agentParam : null,
  );

  if (requestedAgent === CLARI_ASSISTANT_ID) {
    return <StudioClient />;
  }

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
