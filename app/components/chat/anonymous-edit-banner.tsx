"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

export function AnonymousEditBanner() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
      <p className="mx-auto max-w-3xl">
        You&apos;re using TexoCAD without an account.{" "}
        <button
          type="button"
          onClick={() => openSignIn()}
          className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
        >
          Sign in
        </button>{" "}
        to keep access to your work later.
      </p>
    </div>
  );
}
