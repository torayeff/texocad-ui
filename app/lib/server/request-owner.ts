import { auth } from "@clerk/nextjs/server";

export async function resolveRequestOwnerId() {
  const { userId } = await auth();
  return userId ?? null;
}
