import { NextResponse } from "next/server";

import { maxLocalModelShareApiBodyBytes } from "@/app/lib/model-formats";
import {
  createLocalModelShareUpload,
  finalizeLocalModelShareUpload,
  LocalModelShareError,
} from "@/app/lib/server/local-model-shares";
import type { LocalModelShareApiRequest, LocalModelShareErrorResponse } from "@/app/types/local-model-share";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message } satisfies LocalModelShareErrorResponse, { status });
}

function clientIpForRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

async function readRequestBody(request: Request): Promise<LocalModelShareApiRequest | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  const text = await request.text();
  if (!text || text.length > maxLocalModelShareApiBodyBytes) {
    return null;
  }

  try {
    return JSON.parse(text) as LocalModelShareApiRequest;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  if (!body) {
    return jsonError("Invalid share upload request.", 400);
  }

  try {
    if (body.action === "finalizeUpload") {
      return NextResponse.json(await finalizeLocalModelShareUpload(body));
    }

    if (body.action !== "createUpload") {
      return jsonError("Invalid share upload request.", 400);
    }

    const clientIp = clientIpForRequest(request);
    return NextResponse.json(await createLocalModelShareUpload(body, clientIp));
  } catch (error) {
    if (error instanceof LocalModelShareError) {
      return jsonError(error.message, error.status);
    }

    console.error("Failed to share local model.", error);
    return jsonError("Failed to share local model.", 500);
  }
}
