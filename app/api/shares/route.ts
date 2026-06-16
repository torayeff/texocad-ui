import { NextResponse } from "next/server";

import {
  createOrGetSharedArtifact,
  getSharedArtifactForRevision,
} from "@/app/lib/server/shared-artifacts";
import { captureServerEvent } from "@/app/lib/server/analytics";
import { durationBucket, errorKind } from "@/app/lib/analytics/events";
import {
  parseShareInput,
  parseShareRevisionInput,
  validateShareBlob,
  validateShareName,
} from "@/app/lib/server/shared-artifact-validation";
import { resolveRequestOwnerId } from "@/app/lib/server/request-owner";
import type { SharedArtifactResult } from "@/app/types/share-artifact";

export const runtime = "nodejs";

async function captureShareLookup(
  startedAt: number,
  status: number,
  success: boolean,
  input?: { kind?: string },
  options: { distinctId?: string; error?: unknown; found?: boolean } = {},
) {
  await captureServerEvent("api_share_lookup", {
    artifact_kind: input?.kind ?? "model",
    duration_bucket: durationBucket(performance.now() - startedAt),
    error_kind: options.error === undefined ? undefined : errorKind(options.error),
    found: options.found,
    status,
    success,
  }, { distinctId: options.distinctId });
}

async function captureShareCreate(
  startedAt: number,
  status: number,
  success: boolean,
  input?: { kind?: string },
  options: { alreadyShared?: boolean; distinctId?: string; error?: unknown } = {},
) {
  await captureServerEvent("api_share_create", {
    already_shared: options.alreadyShared,
    artifact_kind: input?.kind ?? "model",
    duration_bucket: durationBucket(performance.now() - startedAt),
    error_kind: options.error === undefined ? undefined : errorKind(options.error),
    status,
    success,
  }, { distinctId: options.distinctId });
}

function toSharedArtifactResult(
  sharedArtifact: Awaited<ReturnType<typeof getSharedArtifactForRevision>>,
): SharedArtifactResult | null {
  if (!sharedArtifact) return null;
  return { shareUrl: sharedArtifact.shareUrl, slug: sharedArtifact.slug };
}

function sharedArtifactResponse(sharedArtifact: Awaited<ReturnType<typeof getSharedArtifactForRevision>>) {
  return {
    sharedArtifact: toSharedArtifactResult(sharedArtifact),
  };
}

function shareResultResponse(result: Awaited<ReturnType<typeof createOrGetSharedArtifact>>) {
  return {
    alreadyShared: result.alreadyShared,
    sharedArtifact: toSharedArtifactResult(result.sharedArtifact),
  };
}

export async function GET(request: Request) {
  const startedAt = performance.now();
  const userId = await resolveRequestOwnerId();
  if (!userId) {
    await captureShareLookup(startedAt, 401, false, undefined, { error: "unauthorized" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const input = parseShareRevisionInput({
    kind: searchParams.get("kind"),
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
    await captureShareLookup(startedAt, 400, false, undefined, { distinctId: userId, error: "invalid_share_lookup" });
    return NextResponse.json({ error: "Invalid share lookup" }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    await captureShareLookup(startedAt, 403, false, input, { distinctId: userId, error: "forbidden" });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sharedArtifact = await getSharedArtifactForRevision(userId, safeInput);
    const response = NextResponse.json(sharedArtifactResponse(sharedArtifact));
    await captureShareLookup(startedAt, 200, true, input, {
      distinctId: userId,
      found: sharedArtifact !== null,
    });
    return response;
  } catch (error) {
    console.error("Failed to look up shared artifact:", error);
    await captureShareLookup(startedAt, 500, false, input, { distinctId: userId, error });
    return NextResponse.json({ error: "Could not look up the selected revision." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const userId = await resolveRequestOwnerId();
  if (!userId) {
    await captureShareCreate(startedAt, 401, false, undefined, { error: "unauthorized" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = parseShareInput(await request.json().catch(() => null));
  if (!input) {
    await captureShareCreate(startedAt, 400, false, undefined, { distinctId: userId, error: "invalid_share_payload" });
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  if (!validateShareName(input.name)) {
    await captureShareCreate(startedAt, 400, false, input, { distinctId: userId, error: "invalid_share_name" });
    return NextResponse.json({ error: "Enter a share name up to 80 characters." }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    await captureShareCreate(startedAt, 400, false, input, { distinctId: userId, error: "invalid_share_blob" });
    return NextResponse.json({ error: "Selected revision cannot be shared." }, { status: 400 });
  }

  try {
    const result = await createOrGetSharedArtifact(userId, {
      ...safeInput,
      name: input.name,
    });
    const response = NextResponse.json(shareResultResponse(result));
    await captureShareCreate(startedAt, 200, true, input, {
      alreadyShared: result.alreadyShared,
      distinctId: userId,
    });
    return response;
  } catch (error) {
    console.error("Failed to share artifact:", error);
    await captureShareCreate(startedAt, 500, false, input, { distinctId: userId, error });
    return NextResponse.json({ error: "Could not share the selected revision." }, { status: 500 });
  }
}
