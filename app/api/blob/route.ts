import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { ulid } from "ulidx";

import { getAllShowcaseItems } from "@/app/showcase/_lib/showcase";
import { LANGGRAPH_API_URL } from "@/app/studio/_lib/langgraph-config";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "";

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

async function isShowcaseThread(threadId: string): Promise<boolean> {
  const items = await getAllShowcaseItems();
  return items.some((item) => item.thread_id === threadId);
}

async function langgraphThreadIsOwned(
  threadId: string,
  bearer: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${LANGGRAPH_API_URL}/threads/${encodeURIComponent(threadId)}`,
      {
        headers: { Authorization: bearer },
        cache: "no-store",
      },
    );
    return response.ok;
  } catch (err) {
    console.error("LangGraph thread ownership check failed:", err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url");
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!connectionString || !containerName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let blobName: string;
  try {
    const { host } = parseCredentials(connectionString);
    const parsed = new URL(blobUrl);
    if (parsed.host !== host) {
      return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
    }
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2 || pathParts[0] !== containerName) {
      return NextResponse.json({ error: "Invalid container" }, { status: 400 });
    }
    blobName = pathParts.slice(1).join("/");
  } catch (err) {
    console.error("Failed to parse blob URL:", err);
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  const [kind, id, ...rest] = blobName.split("/");
  const isThreadBlob = kind === "threads" && !!id && rest.length > 0;
  const isUploadBlob = kind === "uploads" && !!id && rest.length > 0;

  if (isThreadBlob && (await isShowcaseThread(id))) {
    return signReadSas(blobUrl, blobName);
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUploadBlob) {
    if (id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (isThreadBlob) {
    const token = await getToken();
    if (!token || !(await langgraphThreadIsOwned(id, `Bearer ${token}`))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return signReadSas(blobUrl, blobName);
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
  const blobName = `uploads/${userId}/${date}/${base}_${ulid()}${ext}`;

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
