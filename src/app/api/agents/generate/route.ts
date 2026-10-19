import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { runPipeline } from "@/agents/director";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      channelId,
      prompt,
      language,
      quality,
      style,
      duration,
      reelId: existingReelId,
    } = body;

    if (!channelId || !prompt) {
      return NextResponse.json(
        { error: "channelId and prompt are required" },
        { status: 400 },
      );
    }

    // If reelId already exists (from WhatsApp route), reuse it — don't create duplicate
    let reelId: string;
    if (existingReelId) {
      const existing = await db.reel.findUnique({
        where: { id: existingReelId },
      });
      if (existing) {
        reelId = existing.id;
      } else {
        return NextResponse.json({ error: "Reel not found" }, { status: 404 });
      }
    } else {
      const user = await db.user.findFirst();
      if (!user) {
        return NextResponse.json(
          { error: "No user found in database" },
          { status: 500 },
        );
      }
      const reel = await db.reel.create({
        data: {
          userId: user.id,
          channelId,
          prompt,
          language: language ?? "ENGLISH",
          quality: quality ?? "HD_1080P",
          style: style ?? "CINEMATIC",
          duration: duration ?? 60,
          status: "PENDING",
        },
      });
      reelId = reel.id;
    }

    // Run the pipeline asynchronously — response returns immediately
    // SSE stream at /api/sse?reelId=<id> delivers real-time updates
    setImmediate(async () => {
      try {
        await db.reel.update({
          where: { id: reelId },
          data: { status: "SCRIPTING" },
        });

        await runPipeline(reelId, channelId, prompt, style, language);
      } catch (err) {
        console.error("[generate] Pipeline error:", err);
        await db.reel.update({
          where: { id: reelId },
          data: {
            status: "FAILED",
            pipelineState: { error: String(err) },
          },
        });
      }
    });

    return NextResponse.json({ reelId, status: "STARTED" });
  } catch (err) {
    console.error("[generate] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
