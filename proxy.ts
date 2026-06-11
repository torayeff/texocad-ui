import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import { CLARI_ASSISTANT_ID } from "@/app/lib/chat/langgraph-config";

const isProtectedRoute = createRouteMatcher(["/studio(.*)"]);
const isMaintenanceRoute = createRouteMatcher(["/maintenance"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

function isClariStudioRequest(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get(AGENT_QUERY_PARAM) === CLARI_ASSISTANT_ID;
}

export default clerkMiddleware(async (auth, req) => {
  if (isMaintenanceMode && !isMaintenanceRoute(req) && !isApiRoute(req)) {
    return NextResponse.rewrite(new URL("/maintenance", req.url));
  }

  if (isProtectedRoute(req) && !isClariStudioRequest(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
