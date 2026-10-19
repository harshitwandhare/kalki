import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = req.nextUrl;
    const reelId = searchParams.get("reelId") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 },
      );
    }

    // When reelId is provided, verify the reel belongs to this user
    if (reelId) {
      const reel = await db.reel.findFirst({ where: { id: reelId, userId } });
      if (!reel) {
        return NextResponse.json({ error: "Reel not found" }, { status: 404 });
      }
    }

    const logs = await db.agentLog.findMany({
      where: reelId ? { reelId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[GET /api/agents/logs] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
