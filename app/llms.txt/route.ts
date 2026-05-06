import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ROUTES,
  SITE_URL,
  absoluteSiteUrl,
} from "@/app/lib/site";

export async function GET() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Site",
    "",
    `- Main site: ${SITE_URL}`,
    `- Studio: ${absoluteSiteUrl(SITE_ROUTES.studio)}`,
    `- Sitemap: ${absoluteSiteUrl(SITE_ROUTES.sitemap)}`,
    "",
  ];

  lines.push(
    "",
    "## Guidance",
    "",
    "- Use the homepage when you need a concise product overview.",
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
