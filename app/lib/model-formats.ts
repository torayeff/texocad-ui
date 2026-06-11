import type { LocalModelShareExtension } from "@/app/types/local-model-share";
import type { ModelFormat } from "@/app/types/model-viewer";

import { slugify } from "@/app/lib/slugify";

const localModelShareExtensions: LocalModelShareExtension[] = ["step", "stl", "glb", "gltf"];
export const maxLocalModelShareUploadBytes = 100 * 1024 * 1024;
export const maxLocalModelShareApiBodyBytes = 8 * 1024;
export const maxLocalModelShareFileNameChars = 255;
export const maxLocalModelShareNameChars = 80;
const maxLocalModelShareSlugChars = 96;
export const localModelShareFileSizeMessage = "Model files must be 100 MB or smaller.";

const acceptedLocalShareExtensions = new Map<string, LocalModelShareExtension>([
  ["step", "step"],
  ["stp", "step"],
  ["stl", "stl"],
  ["glb", "glb"],
  ["gltf", "gltf"],
]);

export function extensionFromName(name: string) {
  const cleanName = name.split(/[?#]/)[0];
  const dotIndex = cleanName.lastIndexOf(".");
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1).toLowerCase() : "";
}

export function slugifyLocalModelShareName(value: string) {
  return slugify(value, { maxLength: maxLocalModelShareSlugChars, normalize: true });
}

export function normalizeLocalModelShareExtension(name: string) {
  return acceptedLocalShareExtensions.get(extensionFromName(name)) ?? null;
}

export function isLocalModelShareExtension(value: unknown): value is LocalModelShareExtension {
  return typeof value === "string" && localModelShareExtensions.includes(value as LocalModelShareExtension);
}

export function isValidLocalModelShareSlug(slug: string) {
  return Boolean(slug && slug.length <= maxLocalModelShareSlugChars && slugifyLocalModelShareName(slug) === slug);
}

export function contentTypeForLocalModelShare(extension: LocalModelShareExtension) {
  switch (extension) {
    case "step":
      return "model/step";
    case "stl":
      return "model/stl";
    case "glb":
      return "model/gltf-binary";
    case "gltf":
      return "model/gltf+json";
    default: {
      const exhaustive: never = extension;
      throw new Error(`Unhandled local model share extension: ${String(exhaustive)}`);
    }
  }
}

export function modelFormatFromName(name: string): ModelFormat {
  switch (extensionFromName(name)) {
    case "step":
    case "stp":
      return "step";
    case "stl":
      return "stl";
    case "glb":
    case "gltf":
      return "glb";
    default:
      throw new Error("Unsupported model format. Use STEP, STP, STL, GLB, or self-contained GLTF.");
  }
}
