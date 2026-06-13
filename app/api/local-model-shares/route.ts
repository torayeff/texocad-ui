import { NextResponse } from "next/server";

import { maxLocalModelShareApiBodyBytes } from "@/app/lib/model-formats";
import { captureServerEvent } from "@/app/lib/server/analytics";
import { durationBucket, errorKind } from "@/app/lib/analytics/events";
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

async function captureLocalModelShareOutcome(
  eventName: "api_local_model_share_create_upload" | "api_local_model_share_finalize",
  startedAt: number,
  status: number,
  success: boolean,
  error?: unknown,
) {
  await captureServerEvent(eventName, {
    duration_bucket: durationBucket(performance.now() - startedAt),
    error_kind: error === undefined ? undefined : errorKind(error),
    status,
    success,
  });
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
  const startedAt = performance.now();
  const body = await readRequestBody(request);
  if (!body) {
    await captureLocalModelShareOutcome("api_local_model_share_create_upload", startedAt, 400, false, "invalid_request");
    return jsonError("Invalid share upload request.", 400);
  }

  try {
    if (body.action === "finalizeUpload") {
      const response = NextResponse.json(await finalizeLocalModelShareUpload(body));
      await captureLocalModelShareOutcome("api_local_model_share_finalize", startedAt, 200, true);
      return response;
    }

    if (body.action !== "createUpload") {
      await captureLocalModelShareOutcome("api_local_model_share_create_upload", startedAt, 400, false, "invalid_action");
      return jsonError("Invalid share upload request.", 400);
    }

    const clientIp = clientIpForRequest(request);
    const response = NextResponse.json(await createLocalModelShareUpload(body, clientIp));
    await captureLocalModelShareOutcome("api_local_model_share_create_upload", startedAt, 200, true);
    return response;
  } catch (error) {
    if (error instanceof LocalModelShareError) {
      await captureLocalModelShareOutcome(
        body.action === "finalizeUpload" ? "api_local_model_share_finalize" : "api_local_model_share_create_upload",
        startedAt,
        error.status,
        false,
        error,
      );
      return jsonError(error.message, error.status);
    }

    console.error("Failed to share local model.", error);
    await captureLocalModelShareOutcome(
      body.action === "finalizeUpload" ? "api_local_model_share_finalize" : "api_local_model_share_create_upload",
      startedAt,
      500,
      false,
      error,
    );
    return jsonError("Failed to share local model.", 500);
  }
}
