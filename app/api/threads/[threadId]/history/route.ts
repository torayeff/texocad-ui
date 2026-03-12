import { proxyBackendJson } from "@/app/lib/server/chat-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await context.params;
  return proxyBackendJson(`/api/threads/${threadId}/history`);
}
