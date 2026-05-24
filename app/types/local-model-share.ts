export type LocalModelShareExtension = "step" | "stl" | "glb" | "gltf";

export interface LocalModelShareUploadRequest {
  action: "createUpload";
  fileName: string;
  fileSize: number;
  shareName: string;
}

export interface LocalModelShareFinalizeRequest {
  action: "finalizeUpload";
  extension: LocalModelShareExtension;
  fileName: string;
  shareName: string;
  slug: string;
}

export interface LocalModelShareUploadResponse {
  expiresAt: string;
  extension: LocalModelShareExtension;
  slug: string;
  uploadUrl: string;
}

export interface LocalModelShareSuccessResponse {
  shareUrl: string;
  slug: string;
}

export interface LocalModelShareErrorResponse {
  error: string;
}

export type LocalModelShareApiRequest = LocalModelShareUploadRequest | LocalModelShareFinalizeRequest;
export type LocalModelShareApiResponse =
  | LocalModelShareErrorResponse
  | LocalModelShareSuccessResponse
  | LocalModelShareUploadResponse;

export const localModelShareExtensions: LocalModelShareExtension[] = ["step", "stl", "glb", "gltf"];
export const maxLocalModelShareUploadBytes = 100 * 1024 * 1024;
export const maxLocalModelShareApiBodyBytes = 8 * 1024;
export const maxLocalModelShareFileNameChars = 255;
export const maxLocalModelShareNameChars = 80;
export const maxLocalModelShareSlugChars = 96;

const acceptedExtensions = new Map<string, LocalModelShareExtension>([
  ["step", "step"],
  ["stp", "step"],
  ["stl", "stl"],
  ["glb", "glb"],
  ["gltf", "gltf"],
]);

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

export function slugifyLocalModelShareName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLocalModelShareSlugChars)
    .replace(/-+$/g, "");
}

export function extensionFromName(name: string) {
  const cleanName = name.split(/[?#]/)[0];
  const dotIndex = cleanName.lastIndexOf(".");

  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1).toLowerCase() : "";
}

export function normalizeLocalModelShareExtension(name: string) {
  return acceptedExtensions.get(extensionFromName(name)) ?? null;
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
    default:
      return assertNever(extension, "Unhandled local model share extension");
  }
}
