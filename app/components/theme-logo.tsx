"use client";

import Image from "next/image";
import { useTheme } from "@wrksz/themes/client";

import { useMounted } from "@/app/hooks/use-mounted";

interface ThemeLogoProps {
  alt?: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function ThemeLogo({
  alt = "TexoCAD",
  width,
  height,
  priority,
}: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Image
      src={isDark ? "/logo/logo-light.png" : "/logo/logo-dark.png"}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
    />
  );
}
