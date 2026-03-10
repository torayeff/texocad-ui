import { proxyBackendJson } from "@/app/lib/server/chatProxy";

export async function POST() {
  return proxyBackendJson("/api/threads", {
    method: "POST",
  });
}
