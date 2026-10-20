import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { guard } from "@/lib/api-auth";
import { startPipeline } from "@/services/pipeline-start";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const g = await guard("EDITOR");
    if (!g.ok) return g.response;
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
      const reel = await db.reel.create({
        data: {
          userId: g.session.user.id,
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

    startPipeline({ reelId, channelId, prompt, style, language });

    return NextResponse.json({ reelId, status: "STARTED" });
  } catch (err) {
    console.error("[generate] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
