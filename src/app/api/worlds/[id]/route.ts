import { guard } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const g = await guard("EDITOR");
    if (!g.ok) return g.response;
    const { id } = await params;
    const body = (await req.json()) as { referenceUrls?: string[] };

    if (!Array.isArray(body.referenceUrls)) {
      return NextResponse.json(
        { error: "referenceUrls must be an array" },
        { status: 400 },
      );
    }

    const world = await db.world.update({
      where: { id },
      data: { referenceUrls: body.referenceUrls },
      select: { id: true, referenceUrls: true },
    });

    return NextResponse.json(world);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
