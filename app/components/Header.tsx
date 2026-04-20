"use client";

import { UserButton, useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
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

  return (
    <header className="h-12 shrink-0 border-b border-border px-4 flex items-center justify-between text-sm select-none">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          aria-label="TexoCAD"
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
      </div>

      <div className="flex items-center gap-4">
        {isSignedIn && !hasAccess && (
          <Link
            href={SITE_ROUTES.pricing}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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
    </header>
  );
}
