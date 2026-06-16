import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createUploadBlobName,
  isBlobStorageConfigured,
  isSafeUploadFilename,
  resolveBlobLookup,
  signedReadUrl,
  signedUploadUrl,
} from "@/app/lib/server/blob-storage";
import { captureServerEvent } from "@/app/lib/server/analytics";
import { durationBucket, errorKind } from "@/app/lib/analytics/events";
import { resolveRequestOwnerId } from "@/app/lib/server/request-owner";
import { hashUserId, isAuthorizedUserBlob } from "@/app/lib/server/storage-auth";

async function captureBlobRead(startedAt: number, status: number, success: boolean, error?: unknown, distinctId?: string) {
  await captureServerEvent("api_blob_signed_read", {
    duration_bucket: durationBucket(performance.now() - startedAt),
    error_kind: error === undefined ? undefined : errorKind(error),
    status,
    success,
  }, { distinctId });
}

async function captureBlobUpload(startedAt: number, status: number, success: boolean, error?: unknown, distinctId?: string) {
  await captureServerEvent("api_blob_signed_upload", {
    duration_bucket: durationBucket(performance.now() - startedAt),
    error_kind: error === undefined ? undefined : errorKind(error),
    status,
    success,
  }, { distinctId });
}

export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const blobUrl = request.nextUrl.searchParams.get("url");
  const blobNameParam = request.nextUrl.searchParams.get("blobName");
  if (!blobUrl && !blobNameParam) {
    await captureBlobRead(startedAt, 400, false, "missing_blob_lookup");
    return NextResponse.json({ error: "Missing url or blobName parameter" }, { status: 400 });
  }

  if (!isBlobStorageConfigured()) {
    await captureBlobRead(startedAt, 500, false, "storage_not_configured");
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let resolvedBlob;
  try {
    resolvedBlob = resolveBlobLookup(blobUrl, blobNameParam);
  } catch (err) {
    console.error("Failed to parse blob URL:", err);
    await captureBlobRead(startedAt, 400, false, err);
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  if (!resolvedBlob) {
    await captureBlobRead(startedAt, 400, false, "invalid_storage_url");
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  const ownerId = await resolveRequestOwnerId();
  if (!ownerId) {
    await captureBlobRead(startedAt, 401, false, "unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorizedUserBlob(resolvedBlob.blobName, hashUserId(ownerId))) {
    await captureBlobRead(startedAt, 403, false, "forbidden", ownerId);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const response = NextResponse.json({ sasUrl: signedReadUrl(resolvedBlob.blobUrl, resolvedBlob.blobName) });
    await captureBlobRead(startedAt, 200, true, undefined, ownerId);
    return response;
  } catch (err) {
    console.error("Failed to generate SAS URL:", err);
    await captureBlobRead(startedAt, 500, false, err, ownerId);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const ownerId = await resolveRequestOwnerId();
  if (!ownerId) {
    await captureBlobUpload(startedAt, 401, false, "unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBlobStorageConfigured()) {
    await captureBlobUpload(startedAt, 500, false, "storage_not_configured", ownerId);
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { filename?: string } | null;
  const filename = body?.filename;
  if (!filename || !isSafeUploadFilename(filename)) {
    await captureBlobUpload(startedAt, 400, false, "invalid_filename", ownerId);
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const blobName = createUploadBlobName(ownerId, filename);
    const response = NextResponse.json(signedUploadUrl(blobName));
    await captureBlobUpload(startedAt, 200, true, undefined, ownerId);
    return response;
  } catch (err) {
    console.error("Failed to generate upload SAS URL:", err);
    await captureBlobUpload(startedAt, 500, false, err, ownerId);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
