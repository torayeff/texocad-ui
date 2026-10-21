"use client";

import { useEffect, useRef } from "react";
import { FaGithub } from "react-icons/fa6";

import { TrackedAnchor } from "@/app/components/analytics/tracked-link";
import { cn } from "@/app/lib/cn";
import { ASSET_SALE_EMAIL, SOURCE_CODE_URL } from "@/app/lib/site";

const ASSET_SALE_MAILTO = `mailto:${ASSET_SALE_EMAIL}?subject=${encodeURIComponent("TexoCAD assets")}`;

const linkClass =
  "font-semibold underline underline-offset-2 transition-colors hover:text-red-100";

export function AnnouncementBanner() {
  const bannerRef = useRef<HTMLElement | null>(null);

  // Publish the rendered height so full-screen pages can reserve space for the banner.
  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    const rootStyle = document.documentElement.style;
    const observer = new ResizeObserver(() => {
      rootStyle.setProperty("--announcement-height", `${banner.offsetHeight}px`);
    });
    observer.observe(banner);
    return () => {
      observer.disconnect();
      rootStyle.removeProperty("--announcement-height");
    };
  }, []);

  return (
    <aside
      ref={bannerRef}
      aria-label="Shutdown announcement"
      className="bg-red-600 px-[var(--app-chrome-gutter)] py-2 text-center text-xs font-medium leading-4 text-white sm:text-[13px] sm:leading-5 dark:bg-red-700"
    >
      <p>
        <span className="font-semibold">TexoCAD will shut down on 1 November 2026.</span>
        <span className="hidden sm:inline"> Please download any designs you want to keep.</span>{" "}
        TexoCAD is now open source on{" "}
        <TrackedAnchor
          href={SOURCE_CODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          analytics={{
            cta: "github",
            destination: SOURCE_CODE_URL,
            location: "announcement_banner",
          }}
          className={cn("inline-flex items-center gap-1", linkClass)}
        >
          <FaGithub size={13} aria-hidden="true" />
          GitHub
        </TrackedAnchor>
        .
      </p>
      <p>
        TexoCAD assets, including the texocad.com and texocad.ai domains, are for sale. Contact{" "}
        <TrackedAnchor
          href={ASSET_SALE_MAILTO}
          analytics={{
            cta: "asset_sale_email",
            destination: `mailto:${ASSET_SALE_EMAIL}`,
            location: "announcement_banner",
          }}
          className={linkClass}
        >
          {ASSET_SALE_EMAIL}
        </TrackedAnchor>
        .
      </p>
    </aside>
  );
}
