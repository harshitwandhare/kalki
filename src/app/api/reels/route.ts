import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReelStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = req.nextUrl;
    const channelId = searchParams.get("channelId") ?? undefined;
    const statusParam = searchParams.get("status") ?? undefined;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 },
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter" },
        { status: 400 },
      );
    }

    if (statusParam !== undefined) {
      const validStatuses = Object.values(ReelStatus);
      if (!validStatuses.includes(statusParam as ReelStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    const reels = await db.reel.findMany({
      where: {
        userId,
        ...(channelId && { channelId }),
        ...(statusParam && { status: statusParam as ReelStatus }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        channel: {
          select: { name: true, slug: true, theme: true },
        },
      },
    });

    return NextResponse.json(reels);
  } catch (err) {
    console.error("[GET /api/reels] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
