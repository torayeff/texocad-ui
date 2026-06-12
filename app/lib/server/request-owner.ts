import { auth } from "@clerk/nextjs/server";

import { anonymousSessionFromRequest } from "@/app/lib/server/anonymous-session";

export async function resolveRequestOwnerId(request: Request) {
  const { userId } = await auth();
  if (userId) return userId;

  return (await anonymousSessionFromRequest(request))?.ownerId ?? null;
}
