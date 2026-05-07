"use client";

import { useState } from "react";
import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import { Moon, Sun, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { useMounted } from "@/app/hooks/use-mounted";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

const headerGlassClass =
  "relative z-10 flex h-12 shrink-0 select-none items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-4 text-sm shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12] md:px-8";

const mobileMenuClass =
  "absolute left-0 top-12 flex w-full flex-col gap-4 border-b border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-6 py-4 shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12] md:hidden";

const headerLinkClass =
  "rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground";

const headerIconButtonClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:opacity-50";

const mobileHeaderLinkClass =
  "rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground";

export function Header() {
  const { isSignedIn, has, sessionClaims } = useAuth();
  const clerk = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;
  const hasAccess =
    isSignedIn &&
    (has?.({ plan: CLERK_PLAN_SLUG }) ||
      sessionClaims?.freeAccess === true ||
      sessionClaims?.vipAccess === true);

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleSignIn = () => {
    clerk.openSignIn();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`${headerGlassClass} ${isMobileMenuOpen ? "z-50" : ""}`}>
      <div className="flex items-center gap-4 md:gap-8">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`${headerIconButtonClass} md:hidden`}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          href="/"
          aria-label="TexoCAD"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2 py-1 transition-colors duration-150 ease-in-out hover:bg-muted"
        >
          <Image
            src={isDark ? "/logo/logo-light.png" : "/logo/logo-dark.png"}
            alt="TexoCAD"
            width={20}
            height={20}
            priority
          />
          <span className="font-medium tracking-tight">TexoCAD</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href={SITE_ROUTES.studio}
            className={headerLinkClass}
          >
            Studio
          </Link>
          <Link
            href="https://viewer.texocad.ai"
            className={headerLinkClass}
          >
            Viewer
          </Link>
          <Link
            href={SITE_ROUTES.pricing}
            className={headerLinkClass}
          >
            Pricing
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {isSignedIn && !hasAccess && (
          <Link
            href={SITE_ROUTES.pricing}
            className="rounded-md bg-foreground px-4 py-1.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
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
        <button
          type="button"
          onClick={handleThemeToggle}
          disabled={!mounted}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={headerIconButtonClass}
        >
          <ThemeIcon size={16} strokeWidth={2} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className={mobileMenuClass}>
          <Link
            href={SITE_ROUTES.studio}
            className={mobileHeaderLinkClass}
            onClick={closeMobileMenu}
          >
            Studio
          </Link>
          <Link
            href="https://viewer.texocad.ai"
            className={mobileHeaderLinkClass}
            onClick={closeMobileMenu}
          >
            Viewer
          </Link>
          <Link
            href={SITE_ROUTES.pricing}
            className={mobileHeaderLinkClass}
            onClick={closeMobileMenu}
          >
            Pricing
          </Link>
        </div>
      )}
    </header>
  );
}
