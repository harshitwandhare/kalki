import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, searchSimilarCharacters } from "@/services/embed";

export const dynamic = "force-dynamic";

/**
 * GET /api/characters/similar?prompt=<text>&channelId=<id>&limit=<n>
 * Returns the top similar characters for a given prompt using pgvector cosine distance.
 */
export async function GET(req: NextRequest) {
  try {
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
    const characters = await searchSimilarCharacters(
      embedding,
      channelId,
      limit,
    );

    return NextResponse.json({ characters });
  } catch (err) {
    console.error("[GET /api/characters/similar] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
