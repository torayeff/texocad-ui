import { proxyBackendJson } from "@/app/lib/server/chatProxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await context.params;
  return proxyBackendJson(`/api/threads/${threadId}/history`);
}
