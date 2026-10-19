import { createSSEResponse } from "@/services/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get("reelId");

  if (!reelId) {
    return new Response("reelId is required", { status: 400 });
  }

  return createSSEResponse(reelId);
}
