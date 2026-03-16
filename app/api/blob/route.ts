import { NextRequest, NextResponse } from "next/server";
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "";

const READ_SAS_EXPIRY_MS = 24 * 60 * 60 * 1000;
const WRITE_SAS_EXPIRY_MS = 15 * 60 * 1000;

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

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url");
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!connectionString || !containerName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  try {
    const { credential, host } = parseCredentials(connectionString);

    const parsed = new URL(blobUrl);
    if (parsed.host !== host) {
      return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2 || pathParts[0] !== containerName) {
      return NextResponse.json({ error: "Invalid container" }, { status: 400 });
    }
    const blobName = pathParts.slice(1).join("/");

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
  } catch (err) {
    console.error("Failed to generate SAS URL:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!connectionString || !containerName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const body = (await request.json()) as { blobName?: string };
  const blobName = body.blobName;
  if (!blobName || !blobName.startsWith("uploads/")) {
    return NextResponse.json({ error: "Invalid blob name" }, { status: 400 });
  }

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
