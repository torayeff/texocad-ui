import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: SITE_URL,
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    categories: ["technology", "productivity", "design"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo-black.png",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-white.png",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Start Building",
        short_name: "Studio",
        description: "Open TexoCAD Studio",
        url: "/studio",
      },
      {
        name: "Browse Showcase",
        short_name: "Showcase",
        description: "Explore generated CAD examples",
        url: "/",
      },
    ],
  };
}
