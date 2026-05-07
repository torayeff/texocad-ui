import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStudioRoute = createRouteMatcher(["/studio(.*)"]);
const isMaintenanceRoute = createRouteMatcher(["/maintenance"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

export default clerkMiddleware(async (auth, req) => {
  if (isMaintenanceMode && !isMaintenanceRoute(req) && !isApiRoute(req)) {
    return NextResponse.rewrite(new URL("/maintenance", req.url));
  }

  if (isStudioRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
