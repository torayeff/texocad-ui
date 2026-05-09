import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  createOrGetSharedModel,
  getSharedModelForRevision,
  isAuthorizedUserBlob,
  isStepExport,
  hashUserId,
  validatePrivateBlobName,
  validateShareName,
  type ShareModelInput,
} from "@/app/lib/server/shared-models";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseShareInput(value: unknown): ShareModelInput | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, name, exportArtifact } = value;
  const { blobName, checksum, contentType, filename } = exportArtifact;

  if (
    typeof designId !== "string" ||
    typeof revisionNumber !== "number" ||
    typeof name !== "string" ||
    typeof blobName !== "string" ||
    typeof checksum !== "string" ||
    typeof contentType !== "string" ||
    typeof filename !== "string"
  ) {
    return null;
  }

  return {
    designId,
    revisionNumber,
    name,
    exportArtifact: {
      blobName,
      checksum,
      contentType,
      filename,
    },
  };
}

function parseRevisionInput(value: unknown): Omit<ShareModelInput, "name"> | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, exportArtifact } = value;
  const { blobName, checksum, contentType, filename } = exportArtifact;

  if (
    typeof designId !== "string" ||
    typeof revisionNumber !== "number" ||
    typeof blobName !== "string" ||
    typeof checksum !== "string" ||
    typeof contentType !== "string" ||
    typeof filename !== "string"
  ) {
    return null;
  }

  return {
    designId,
    revisionNumber,
    exportArtifact: {
      blobName,
      checksum,
      contentType,
      filename,
    },
  };
}

function validateShareBlob(userId: string, input: Omit<ShareModelInput, "name">) {
  const blobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  if (!validatePrivateBlobName(blobName) || !isStepExport(input.exportArtifact.filename, input.exportArtifact.contentType)) {
    return null;
  }

  if (!isAuthorizedUserBlob(blobName, hashUserId(userId))) {
    return null;
  }

  return {
    ...input,
    exportArtifact: {
      ...input.exportArtifact,
      blobName,
    },
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const input = parseRevisionInput({
    designId: searchParams.get("designId"),
    revisionNumber: Number(searchParams.get("revisionNumber")),
    exportArtifact: {
      blobName: searchParams.get("blobName"),
      checksum: searchParams.get("checksum"),
      contentType: searchParams.get("contentType"),
      filename: searchParams.get("filename"),
    },
  });
  if (!input) {
    return NextResponse.json({ error: "Invalid share lookup" }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sharedModel = await getSharedModelForRevision(userId, safeInput);
    return NextResponse.json({ sharedModel });
  } catch (error) {
    console.error("Failed to look up shared model:", error);
    return NextResponse.json({ error: "Could not look up the selected revision." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = parseShareInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  if (!validateShareName(input.name)) {
    return NextResponse.json({ error: "Enter a model name up to 80 characters." }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    return NextResponse.json({ error: "Selected revision is not a STEP export." }, { status: 400 });
  }

  try {
    const result = await createOrGetSharedModel(userId, {
      ...safeInput,
      name: input.name,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to share model:", error);
    return NextResponse.json({ error: "Could not share the selected revision." }, { status: 500 });
  }
}
