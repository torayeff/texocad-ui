import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ROUTES,
  SITE_URL,
  absoluteSiteUrl,
} from "@/app/lib/site";
import {
  getAllShowcaseItems,
  getShowcaseItemCanonical,
  getShowcaseItemSummary,
} from "@/app/showcase/_lib/showcase";

export async function GET() {
  const items = await getAllShowcaseItems();

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Site",
    "",
    `- Main site: ${SITE_URL}`,
    `- Studio: ${absoluteSiteUrl(SITE_ROUTES.studio)}`,
    `- Showcase: ${absoluteSiteUrl(SITE_ROUTES.home)}`,
    `- Sitemap: ${absoluteSiteUrl(SITE_ROUTES.sitemap)}`,
    "",
    "## Showcase Examples",
    "",
  ];

  for (const item of items) {
    lines.push(
      `- [${item.name}](${getShowcaseItemCanonical(item.thread_id)}): ${getShowcaseItemSummary(item)}`,
    );
  }

  lines.push(
    "",
    "## Guidance",
    "",
    "- Prefer the canonical showcase URLs when citing specific examples.",
    "- Use the homepage when you need a concise product overview and the latest showcase gallery.",
    "- TexoCAD focuses on natural-language CAD generation, editable geometry, rapid prototyping, and manufacturing handoff for physical products.",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
