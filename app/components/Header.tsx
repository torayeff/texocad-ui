"use client";

import { useState } from "react";
import { UserButton, useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Moon, Sun, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { useMounted } from "@/app/hooks/use-mounted";
import { CLERK_PLAN_SLUG, SITE_ROUTES } from "@/app/lib/site";

export function Header() {
  const { isSignedIn, has } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;
  const hasAccess =
    isSignedIn && (has?.({ plan: CLERK_PLAN_SLUG }) || user?.publicMetadata?.freeAccess === true);

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
    <header className="h-12 shrink-0 border-b border-border px-4 md:px-8 flex items-center justify-between text-sm select-none relative z-50 bg-background">
      <div className="flex items-center gap-4 md:gap-8">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          href="/"
          aria-label="TexoCAD"
          onClick={closeMobileMenu}
          className="transition-opacity hover:opacity-80 flex items-center gap-2"
        >
          <Image
            src={isDark ? "/logo-white.png" : "/logo-black.png"}
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
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Studio
          </Link>
          <Link
            href={SITE_ROUTES.pricing}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
        )}
        <button
          type="button"
          onClick={handleThemeToggle}
          disabled={!mounted}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <ThemeIcon size={16} strokeWidth={2} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-12 left-0 w-full border-b border-border bg-background px-6 py-4 flex flex-col gap-4 md:hidden shadow-sm">
          <Link
            href={SITE_ROUTES.studio}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMobileMenu}
          >
            Studio
          </Link>
          <Link
            href={SITE_ROUTES.pricing}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMobileMenu}
          >
            Pricing
          </Link>
        </div>
      )}
    </header>
  );
}
