import type { MetadataRoute } from "next";

import { SITE_ROUTES, absoluteSiteUrl } from "@/app/lib/site";

const sitemapRoutes = [
  { route: SITE_ROUTES.home, changeFrequency: "weekly", priority: 1 },
  { route: SITE_ROUTES.pricing, changeFrequency: "monthly", priority: 0.8 },
  { route: SITE_ROUTES.viewer, changeFrequency: "monthly", priority: 0.7 },
  { route: SITE_ROUTES.expertNetwork, changeFrequency: "monthly", priority: 0.6 },
  { route: SITE_ROUTES.humanExpertsNetwork, changeFrequency: "monthly", priority: 0.6 },
  { route: SITE_ROUTES.privacy, changeFrequency: "yearly", priority: 0.2 },
  { route: SITE_ROUTES.terms, changeFrequency: "yearly", priority: 0.2 },
] satisfies Array<{
  route: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return sitemapRoutes.map(({ route, changeFrequency, priority }) => ({
    url: absoluteSiteUrl(route),
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
