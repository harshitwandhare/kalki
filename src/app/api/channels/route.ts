import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChannelTheme, Language, Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const channels = await db.channel.findMany({
      where: { userId },
      include: {
        _count: {
          select: { characters: true, worlds: true, reels: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(channels);
  } catch (err) {
    console.error("[GET /api/channels] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      slug: slugInput,
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

    if (!name || !theme) {
      return NextResponse.json(
        { error: "name and theme are required" },
        { status: 400 },
      );
    }

    const validThemes = Object.values(ChannelTheme);
    if (!validThemes.includes(theme as ChannelTheme)) {
      return NextResponse.json(
        { error: `Invalid theme. Valid values: ${validThemes.join(", ")}` },
        { status: 400 },
      );
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

    // Generate slug from name if not provided
    const baseSlug = (slugInput ?? name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await db.channel.count({
      where: { slug: { startsWith: baseSlug } },
    });
    const slug = existing > 0 ? `${baseSlug}-${existing}` : baseSlug;

    // Store non-schema fields in config JSON
    const config: Record<string, unknown> = {};
    if (videoQuality !== undefined) config.videoQuality = videoQuality;
    if (videoStyle !== undefined) config.videoStyle = videoStyle;
    if (defaultDuration !== undefined) config.defaultDuration = defaultDuration;
    if (avatarUrl !== undefined) config.avatarUrl = avatarUrl;

    const channel = await db.channel.create({
      data: {
        userId,
        name,
        slug,
        theme: theme as ChannelTheme,
        targetAudience: targetAudience ?? "",
        language: (language as Language) ?? Language.ENGLISH,
        description: description ?? null,
        config: config as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (err) {
    console.error("[POST /api/channels] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
