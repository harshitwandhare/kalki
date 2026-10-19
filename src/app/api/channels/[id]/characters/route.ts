import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id: channelId } = await params;
    const userId = (await db.user.findFirst())!.id;

    const channel = await db.channel.findFirst({
      where: { id: channelId, userId },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const characters = await db.character.findMany({
      where: { channelId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        soulDocument: true,
        referenceUrls: true,
        loraPath: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(characters);
  } catch (err) {
    console.error("[GET /api/channels/[id]/characters] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: channelId } = await params;
    const userId = (await db.user.findFirst())!.id;

    const channel = await db.channel.findFirst({
      where: { id: channelId, userId },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, soulDocument } = body as {
      name?: string;
      soulDocument?: Record<string, unknown>;
    };

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (soulDocument === undefined || soulDocument === null) {
      return NextResponse.json(
        { error: "soulDocument is required" },
        { status: 400 },
      );
    }

    if (typeof soulDocument !== "object" || Array.isArray(soulDocument)) {
      return NextResponse.json(
        { error: "soulDocument must be a JSON object" },
        { status: 400 },
      );
    }

    const character = await db.character.create({
      data: {
        channelId,
        name,
        soulDocument: soulDocument as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        channelId: true,
        name: true,
        soulDocument: true,
        referenceUrls: true,
        loraPath: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (err) {
    console.error("[POST /api/channels/[id]/characters] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
