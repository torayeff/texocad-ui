import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  createUploadBlobName,
  isBlobStorageConfigured,
  isSafeUploadFilename,
  resolveBlobLookup,
  signedReadUrl,
  signedUploadUrl,
} from "@/app/lib/server/blob-storage";
import { hashUserId, isAuthorizedUserBlob } from "@/app/lib/server/storage-auth";

// Owner identity for blob scoping: the signed-in Clerk user id.
async function resolveOwnerId() {
  const { userId } = await auth();
  return userId;
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url");
  const blobNameParam = request.nextUrl.searchParams.get("blobName");
  if (!blobUrl && !blobNameParam) {
    return NextResponse.json({ error: "Missing url or blobName parameter" }, { status: 400 });
  }

  if (!isBlobStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let resolvedBlob;
  try {
    resolvedBlob = resolveBlobLookup(blobUrl, blobNameParam);
  } catch (err) {
    console.error("Failed to parse blob URL:", err);
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  if (!resolvedBlob) {
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  const ownerId = await resolveOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorizedUserBlob(resolvedBlob.blobName, hashUserId(ownerId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json({ sasUrl: signedReadUrl(resolvedBlob.blobUrl, resolvedBlob.blobName) });
  } catch (err) {
    console.error("Failed to generate SAS URL:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ownerId = await resolveOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBlobStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { filename?: string } | null;
  const filename = body?.filename;
  if (!filename || !isSafeUploadFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const blobName = createUploadBlobName(ownerId, filename);
    return NextResponse.json(signedUploadUrl(blobName));
  } catch (err) {
    console.error("Failed to generate upload SAS URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
