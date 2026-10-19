import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChannelTheme, Language, Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? "temp-user";

    const channel = await db.channel.findFirst({
      where: { id, userId },
      include: {
        characters: {
          select: {
            id: true,
            name: true,
            soulDocument: true,
            referenceUrls: true,
            createdAt: true,
          },
        },
        worlds: {
          select: {
            id: true,
            name: true,
            description: true,
            visualStyle: true,
            referenceUrls: true,
            createdAt: true,
          },
        },
        reels: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            prompt: true,
            title: true,
            status: true,
            language: true,
            duration: true,
            quality: true,
            style: true,
            thumbnailUrl: true,
            videoUrl: true,
            createdAt: true,
          },
        },
        _count: {
          select: { characters: true, worlds: true, reels: true },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json(channel);
  } catch (err) {
    console.error("[GET /api/channels/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? "temp-user";

    const existing = await db.channel.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      slug,
      theme,
      description,
      language,
      targetAudience,
      videoQuality,
      videoStyle,
      defaultDuration,
      avatarUrl,
    } = body as {
      name?: string;
      slug?: string;
      theme?: string;
      description?: string;
      language?: string;
      targetAudience?: string;
      videoQuality?: string;
      videoStyle?: string;
      defaultDuration?: number;
      avatarUrl?: string;
    };

    if (theme !== undefined) {
      const validThemes = Object.values(ChannelTheme);
      if (!validThemes.includes(theme as ChannelTheme)) {
        return NextResponse.json(
          { error: `Invalid theme. Valid values: ${validThemes.join(", ")}` },
          { status: 400 },
        );
      }
    }

    if (language !== undefined) {
      const validLanguages = Object.values(Language);
      if (!validLanguages.includes(language as Language)) {
        return NextResponse.json(
          {
            error: `Invalid language. Valid values: ${validLanguages.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Merge config fields (non-schema fields stored in config JSON)
    let updatedConfig: Record<string, unknown> | undefined;
    if (
      videoQuality !== undefined ||
      videoStyle !== undefined ||
      defaultDuration !== undefined ||
      avatarUrl !== undefined
    ) {
      const existingConfig =
        typeof existing.config === "object" && existing.config !== null
          ? (existing.config as Record<string, unknown>)
          : {};
      updatedConfig = { ...existingConfig };
      if (videoQuality !== undefined) updatedConfig.videoQuality = videoQuality;
      if (videoStyle !== undefined) updatedConfig.videoStyle = videoStyle;
      if (defaultDuration !== undefined)
        updatedConfig.defaultDuration = defaultDuration;
      if (avatarUrl !== undefined) updatedConfig.avatarUrl = avatarUrl;
    }

    const updated = await db.channel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(theme !== undefined && { theme: theme as ChannelTheme }),
        ...(description !== undefined && { description }),
        ...(language !== undefined && { language: language as Language }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(updatedConfig !== undefined && {
          config: updatedConfig as Prisma.InputJsonValue,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/channels/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? "temp-user";

    const existing = await db.channel.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    await db.channel.delete({ where: { id } });

    return NextResponse.json({ message: "Channel deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/channels/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
