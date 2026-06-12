import { NextResponse } from "next/server";

import {
  createOrGetSharedArtifact,
  getSharedArtifactForRevision,
} from "@/app/lib/server/shared-artifacts";
import {
  parseShareInput,
  parseShareRevisionInput,
  validateShareBlob,
  validateShareName,
} from "@/app/lib/server/shared-artifact-validation";
import { resolveRequestOwnerId } from "@/app/lib/server/request-owner";
import type { SharedArtifactResult } from "@/app/types/share-artifact";

export const runtime = "nodejs";

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
  const userId = await resolveRequestOwnerId(request);
  if (!userId) {
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
    return NextResponse.json({ error: "Invalid share lookup" }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sharedArtifact = await getSharedArtifactForRevision(userId, safeInput);
    return NextResponse.json(sharedArtifactResponse(sharedArtifact));
  } catch (error) {
    console.error("Failed to look up shared artifact:", error);
    return NextResponse.json({ error: "Could not look up the selected revision." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await resolveRequestOwnerId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = parseShareInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  if (!validateShareName(input.name)) {
    return NextResponse.json({ error: "Enter a share name up to 80 characters." }, { status: 400 });
  }

  const safeInput = validateShareBlob(userId, input);
  if (!safeInput) {
    return NextResponse.json({ error: "Selected revision cannot be shared." }, { status: 400 });
  }

  try {
    const result = await createOrGetSharedArtifact(userId, {
      ...safeInput,
      name: input.name,
    });
    return NextResponse.json(shareResultResponse(result));
  } catch (error) {
    console.error("Failed to share artifact:", error);
    return NextResponse.json({ error: "Could not share the selected revision." }, { status: 500 });
  }
}
