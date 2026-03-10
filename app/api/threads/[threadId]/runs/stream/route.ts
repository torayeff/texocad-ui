import { proxyBackendStream } from "@/app/lib/server/chatProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await context.params;
  const body = await request.text();

  return proxyBackendStream(`/api/threads/${threadId}/runs/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    body,
  });
}
