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
  finalizeToken: string;
  shareName: string;
  slug: string;
}

export interface LocalModelShareUploadResponse {
  expiresAt: string;
  extension: LocalModelShareExtension;
  finalizeToken: string;
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
