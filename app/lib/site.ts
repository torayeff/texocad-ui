export const COMPANY_NAME = "TexoCAD";
export const SITE_NAME = COMPANY_NAME;
export const SITE_URL = "https://texocad.ai";
export const SUPPORT_EMAIL = "support@texocad.ai";
export const LEGAL_ENTITY_NAME = "ROBOMINDER LTD";
export const LEGAL_ENTITY_NUMBER = "15332373";
export const LEGAL_ENTITY_ADDRESS =
  "18 The Power Station, Robominder Ltd, London, England, SW11 8BZ";
export const LEGAL_GOVERNING_LAW = "England and Wales";
export const LEGAL_LAST_UPDATED = "20 April 2026";
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
export const DEFAULT_OG_IMAGE_PATH = "/images/hero-image-light.jpg";
export const DEFAULT_TWITTER_IMAGE_PATH = "/images/hero-image-light.jpg";

export const CLERK_PLAN_SLUG = process.env.NEXT_PUBLIC_CLERK_PLAN_SLUG!;

export const SITE_ROUTES = {
  home: "/",
  studio: "/studio",
  pricing: "/pricing",
  privacy: "/privacy",
  viewer: "/viewer",
  terms: "/terms",
  llms: "/llms.txt",
  manifest: "/manifest.webmanifest",
  sitemap: "/sitemap.xml",
} as const;

export function absoluteSiteUrl(path: string = SITE_ROUTES.home) {
  return new URL(path, SITE_URL).toString();
}
