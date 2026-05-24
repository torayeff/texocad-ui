"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@wrksz/themes/client";

import { useMounted } from "@/app/hooks/use-mounted";

const themeToggleClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={themeToggleClass}
    >
      <ThemeIcon size={16} strokeWidth={2} />
    </button>
  );
}
