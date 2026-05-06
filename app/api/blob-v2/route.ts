import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { ulid } from "ulidx";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
const containerName = process.env.AZURE_STORAGE_CONTAINER
  ?? process.env.AZURE_STORAGE_CONTAINER_NAME
  ?? "";

const READ_SAS_EXPIRY_MS = 24 * 60 * 60 * 1000;
const WRITE_SAS_EXPIRY_MS = 15 * 60 * 1000;

const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;
const MAX_FILENAME_LENGTH = 120;

function parseCredentials(connStr: string) {
  const account = connStr.match(/AccountName=([^;]+)/)?.[1];
  const key = connStr.match(/AccountKey=([^;]+)/)?.[1];
  const suffix = connStr.match(/EndpointSuffix=([^;]+)/)?.[1] ?? "core.windows.net";
  if (!account || !key) {
    throw new Error("Cannot parse account name or key from connection string");
  }
  return {
    credential: new StorageSharedKeyCredential(account, key),
    host: `${account}.blob.${suffix}`,
  };
}

function signReadSas(blobUrl: string, blobName: string) {
  const { credential } = parseCredentials(connectionString);
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(Date.now() + READ_SAS_EXPIRY_MS),
    },
    credential,
  ).toString();
  return NextResponse.json({ sasUrl: `${blobUrl}?${sasToken}` });
}

function blobUrlForName(blobName: string) {
  const { host } = parseCredentials(connectionString);
  return `https://${host}/${containerName}/${blobName}`;
}

function hashUserId(userId: string) {
  return createHash("sha256").update(userId).digest("hex");
}

function isAuthorizedUserBlob(blobName: string, userHash: string) {
  const [root, hash, kind, , marker, , folder] = blobName.split("/");
  if (root !== "users" || hash !== userHash) return false;

  if (kind === "uploads") return blobName.split("/").length > 3;
  if (kind === "threads") return blobName.split("/").length > 4;
  if (kind !== "designs") return false;

  const parts = blobName.split("/");
  return (
    parts.length >= 8 &&
    marker === "revisions" &&
    (folder === "exports" || folder === "source")
  );
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url");
  const blobNameParam = request.nextUrl.searchParams.get("blobName");
  if (!blobUrl && !blobNameParam) {
    return NextResponse.json({ error: "Missing url or blobName parameter" }, { status: 400 });
  }

  if (!connectionString || !containerName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let blobName: string;
  let resolvedBlobUrl: string;
  if (blobNameParam) {
    blobName = blobNameParam.replace(/^\/+/, "");
    resolvedBlobUrl = blobUrlForName(blobName);
  } else {
    const storageUrl = blobUrl;
    if (!storageUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }
    try {
      const { host } = parseCredentials(connectionString);
      const parsed = new URL(storageUrl);
      if (parsed.host !== host) {
        return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
      }
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2 || pathParts[0] !== containerName) {
        return NextResponse.json({ error: "Invalid container" }, { status: 400 });
      }
      blobName = pathParts.slice(1).join("/");
      resolvedBlobUrl = storageUrl;
    } catch (err) {
      console.error("Failed to parse blob URL:", err);
      return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
    }
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorizedUserBlob(blobName, hashUserId(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return signReadSas(resolvedBlobUrl, blobName);
  } catch (err) {
    console.error("Failed to generate SAS URL:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!connectionString || !containerName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { filename?: string } | null;
  const filename = body?.filename;
  if (
    !filename ||
    filename.length > MAX_FILENAME_LENGTH ||
    !SAFE_FILENAME.test(filename)
  ) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const dotIdx = filename.lastIndexOf(".");
  const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
  const ext = dotIdx > 0 ? filename.slice(dotIdx) : "";
  const date = new Date().toISOString().slice(0, 10);
  const blobName = `users/${hashUserId(userId)}/uploads/${date}/${base}_${ulid()}${ext}`;

  try {
    const { credential, host } = parseCredentials(connectionString);
    const blobUrl = `https://${host}/${containerName}/${blobName}`;

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        expiresOn: new Date(Date.now() + WRITE_SAS_EXPIRY_MS),
      },
      credential,
    ).toString();

    return NextResponse.json({ sasUrl: `${blobUrl}?${sasToken}`, blobUrl });
  } catch (err) {
    console.error("Failed to generate upload SAS URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
