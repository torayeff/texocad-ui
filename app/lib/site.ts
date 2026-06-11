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
export const SITE_TITLE = "TexoCAD - Agentic CAD for Physical Product Builders";
export const SITE_DESCRIPTION =
  "Turn product ideas into real products with AI design agents and human experts for requirements, concepts, CAD, simulation, and manufacturing-ready outputs.";
export const SITE_KEYWORDS = [
  "text to CAD",
  "text to sketch",
  "text to 3D model",
  "text to 3D CAD",
  "sketch to CAD",
  "image to CAD",
  "AI CAD generator",
  "AI 3D model generator",
  "agentic CAD",
  "AI CAD",
  "3D CAD",
  "3D model generator",
  "engineering drawings to CAD",
  "CAD model generation",
  "CAD from sketches",
  "manufacturability checks",
  "rapid prototyping",
  "prototype CAD",
  "natural language CAD",
  "parametric CAD",
  "CAD automation",
  "BREP CAD",
  "STL export",
  "STEP export",
  "AI design agents",
  "AI product design",
  "product design agents",
  "human design experts",
  "requirements engineering",
  "requirements engineer agent",
  "concept development",
  "concept engineer agent",
  "CAD engineer agent",
  "simulation engineer agent",
  "AI product development",
  "product design automation",
  "manufacturing-ready parts",
  "AI prototyping",
  "physical product design",
  "idea to CAD",
  "idea to product",
  "concept to CAD",
  "CAD simulation",
  "design for manufacturing",
];

export const SITE_CATEGORY = "technology";
export const DEFAULT_OG_IMAGE_PATH = "/images/hero-image-light.jpg";
export const DEFAULT_TWITTER_IMAGE_PATH = "/images/hero-image-light.jpg";

export const CLERK_PLAN_SLUG = process.env.NEXT_PUBLIC_CLERK_PLAN_SLUG!;

export const SITE_ROUTES = {
  home: "/",
  forma: "/forma",
  lumi: "/lumi",
  studio: "/studio",
  pricing: "/pricing",
  expertNetwork: "/expert-network",
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
