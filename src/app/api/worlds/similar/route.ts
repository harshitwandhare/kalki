import { guard } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, searchSimilarWorlds } from "@/services/embed";

export const dynamic = "force-dynamic";

/**
 * GET /api/worlds/similar?prompt=<text>&channelId=<id>&limit=<n>
 * Returns the top similar worlds for a given prompt using pgvector cosine distance.
 */
export async function GET(req: NextRequest) {
  try {
    const g = await guard("VIEWER");
    if (!g.ok) return g.response;
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");
    const channelId = searchParams.get("channelId");
    const limit = parseInt(searchParams.get("limit") ?? "5", 10);

    if (!prompt || !channelId) {
      return NextResponse.json(
        { error: "prompt and channelId query params are required" },
        { status: 400 },
      );
    }

    const embedding = await generateEmbedding(prompt);
    const worlds = await searchSimilarWorlds(embedding, channelId, limit);

    return NextResponse.json({ worlds });
  } catch (err) {
    console.error("[GET /api/worlds/similar] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
