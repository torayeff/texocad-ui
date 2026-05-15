"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

import { useMounted } from "@/app/hooks/use-mounted";

export function ThemeHeroImage() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Image
      src={isDark ? "/images/hero-image-dark.png" : "/images/hero-image-light.jpg"}
      alt="Sketch to CAD to product workflow"
      width={1024}
      height={421}
      priority
      className="h-auto w-full"
      sizes="(min-width: 1024px) 58vw, 100vw"
    />
  );
}
