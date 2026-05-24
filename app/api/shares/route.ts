import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  createOrGetSharedArtifact,
  getSharedArtifactForRevision,
  parseShareInput,
  parseShareRevisionInput,
  validateShareBlob,
  validateShareName,
} from "@/app/lib/server/shared-models";

export const runtime = "nodejs";

function sharedArtifactResponse(sharedArtifact: Awaited<ReturnType<typeof getSharedArtifactForRevision>>) {
  return {
    sharedArtifact,
  };
}

function shareResultResponse(result: Awaited<ReturnType<typeof createOrGetSharedArtifact>>) {
  return {
    alreadyShared: result.alreadyShared,
    sharedArtifact: result.sharedArtifact,
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
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
  const { userId } = await auth();
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
