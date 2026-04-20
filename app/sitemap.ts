import type { MetadataRoute } from "next";

import { SITE_ROUTES, SITE_URL } from "@/app/lib/site";
import {
  getAllShowcaseItems,
  getShowcaseItemCanonical,
} from "@/app/showcase/_lib/showcase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getAllShowcaseItems();
  const now = new Date();

  const showcaseEntries: MetadataRoute.Sitemap = items.map((item) => ({
    url: getShowcaseItemCanonical(item.thread_id),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${SITE_ROUTES.pricing}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${SITE_ROUTES.studio}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...showcaseEntries,
  ];
}
