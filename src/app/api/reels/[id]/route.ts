import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? "temp-user";

    const reel = await db.reel.findFirst({
      where: { id, userId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
            theme: true,
            language: true,
          },
        },
        world: {
          select: {
            id: true,
            name: true,
            description: true,
            visualStyle: true,
          },
        },
        characters: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                soulDocument: true,
                referenceUrls: true,
              },
            },
          },
        },
        agentLogs: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            agent: true,
            action: true,
            input: true,
            output: true,
            thinkingBlock: true,
            status: true,
            durationMs: true,
            createdAt: true,
          },
        },
      },
    });

    if (!reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: reel.id,
      channelId: reel.channelId,
      worldId: reel.worldId,
      prompt: reel.prompt,
      title: reel.title,
      script: reel.script,
      status: reel.status,
      language: reel.language,
      duration: reel.duration,
      quality: reel.quality,
      style: reel.style,
      audioConfig: reel.audioConfig,
      thumbnailUrl: reel.thumbnailUrl,
      videoUrl: reel.videoUrl,
      rawAssets: reel.rawAssets,
      ytTitle: reel.ytTitle,
      ytDescription: reel.ytDescription,
      ytTags: reel.ytTags,
      ytCategory: reel.ytCategory,
      ytAudienceAge: reel.ytAudienceAge,
      pipelineState: reel.pipelineState,
      createdAt: reel.createdAt,
      updatedAt: reel.updatedAt,
      channel: reel.channel,
      world: reel.world,
      characters: reel.characters.map((rc) => rc.character),
      agentLogs: reel.agentLogs,
    });
  } catch (err) {
    console.error("[GET /api/reels/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
