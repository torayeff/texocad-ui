export const COMPANY_NAME = "TexoCAD";
export const SITE_NAME = COMPANY_NAME;
export const SITE_URL = "https://texocad.ai";
export const SUPPORT_EMAIL = "support@texocad.ai";
export const SITE_TITLE = "TexoCAD - Agentic Text-to-CAD";
export const SITE_DESCRIPTION =
  "Agentic text-to-CAD for people building physical products. Turn ideas, requirements, and sketches into editable, manufacturing-ready CAD.";
export const SITE_KEYWORDS = [
  "text to CAD",
  "agentic CAD",
  "AI CAD",
  "3D CAD",
  "engineering drawings to CAD",
  "CAD model generation",
  "manufacturability checks",
  "rapid prototyping",
  "prototype CAD",
  "natural language CAD",
  "parametric CAD",
  "CAD automation",
  "BREP CAD",
  "STL export",
  "STEP export",
];

export const SITE_CATEGORY = "technology";
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";
export const DEFAULT_TWITTER_IMAGE_PATH = "/twitter-image";

export const SITE_ROUTES = {
  home: "/",
  studio: "/studio",
  showcaseItemBase: "/showcase/item",
  llms: "/llms.txt",
  manifest: "/manifest.webmanifest",
  sitemap: "/sitemap.xml",
} as const;

export function absoluteSiteUrl(path: string = SITE_ROUTES.home) {
  return new URL(path, SITE_URL).toString();
}

export function getShowcaseItemPath(threadId: string) {
  return `${SITE_ROUTES.showcaseItemBase}?id=${encodeURIComponent(threadId)}`;
}

export function getShowcaseImagePath(threadId: string) {
  return `/showcase/images/${threadId}.jpg`;
}
