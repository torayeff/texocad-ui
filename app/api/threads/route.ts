import { proxyBackendJson } from "@/app/lib/server/chat-proxy";

export async function POST() {
  return proxyBackendJson("/api/threads", {
    method: "POST",
  });
}
