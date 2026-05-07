"use client";

import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";

import { ThemeLogo } from "@/app/components/theme-logo";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

const headerGlassClass =
  "relative z-10 flex h-12 shrink-0 select-none items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-3 text-sm shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12] md:px-8";

const headerLinkClass =
  "rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2 py-1 text-[13px] font-medium text-muted-foreground";

export function Header() {
  const { isSignedIn, has, sessionClaims } = useAuth();
  const clerk = useClerk();

  const hasAccess =
    isSignedIn &&
    (has?.({ plan: CLERK_PLAN_SLUG }) ||
      sessionClaims?.freeAccess === true ||
      sessionClaims?.vipAccess === true);

  const handleSignIn = () => {
    clerk.openSignIn();
  };

  return (
    <header className={headerGlassClass}>
      <div className="flex min-w-0 items-center gap-2 md:gap-8">
        <Link
          href="/"
          aria-label="TexoCAD"
          className="flex min-w-0 items-center gap-2 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-1.5 py-1 md:px-2"
        >
          <ThemeLogo width={20} height={20} priority />
          <span className="truncate font-medium tracking-tight">TexoCAD</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-5">
        {isSignedIn && !hasAccess && (
          <Link
            href={SITE_ROUTES.pricing}
            className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground px-2.5 py-1.5 text-[13px] font-medium text-background md:px-4"
          >
            Upgrade
          </Link>
        )}
        {isSignedIn ? (
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            className={headerLinkClass}
          >
            Sign In
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
