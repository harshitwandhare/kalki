import { createSSEResponse } from "@/services/sse";
import { guard } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const g = await guard("VIEWER");
  if (!g.ok) return g.response;
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get("reelId");

  if (!reelId) {
    return new Response("reelId is required", { status: 400 });
  }

  return createSSEResponse(reelId);
}
