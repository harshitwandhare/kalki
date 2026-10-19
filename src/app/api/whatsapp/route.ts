import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ─── Command Parser ───────────────────────────────────────────────────────────

interface ParsedCommand {
  type: "generate" | "status" | "channels" | "reels" | "help" | "unknown";
  prompt?: string;
  channelSlug?: string;
  reelId?: string;
}

function parseCommand(message: string): ParsedCommand {
  const lower = message.toLowerCase().trim();

  // generate reel: "generate reel about X" / "make reel: X" / "create X"
  const generatePatterns = [
    /^(?:generate|make|create|gen)\s+(?:a\s+)?(?:reel|video|short)\s+(?:about|on|for)?\s*:?\s*(.+)$/i,
    /^(?:reel|video|short)\s*:\s*(.+)$/i,
    /^🎬\s*(.+)$/i,
  ];
  for (const pattern of generatePatterns) {
    const match = message.match(pattern);
    if (match) {
      // Parse channel hint: "for gen z", "for channel A", "on karma"
      let prompt = match[1].trim();
      let channelSlug: string | undefined;
      const channelMatch = prompt.match(
        /\s+(?:for|on|in)\s+(?:channel\s+)?(.+?)(?:\s+channel)?$/i,
      );
      if (channelMatch) {
        const hint = channelMatch[1].toLowerCase();
        if (
          hint.includes("gen z") ||
          hint.includes("india") ||
          hint.includes("viral")
        )
          channelSlug = "indian-gen-z";
        else if (
          hint.includes("parent") ||
          hint.includes("us") ||
          hint.includes("america")
        )
          channelSlug = "us-parents";
        else if (hint.includes("karma") || hint.includes("motiv"))
          channelSlug = "motivation-karma";
        if (channelSlug) prompt = prompt.replace(channelMatch[0], "").trim();
      }
      return { type: "generate", prompt, channelSlug };
    }
  }

  if (/^(?:status|how|what.?s up|progress)/i.test(lower))
    return { type: "status" };
  if (/^(?:channels|my channels|list channels)/i.test(lower))
    return { type: "channels" };
  if (/^(?:reels|my reels|list reels|library)/i.test(lower))
    return { type: "reels" };
  if (/^(?:help|\?|commands|what can you do)/i.test(lower))
    return { type: "help" };

  return { type: "unknown" };
}

// ─── Response Formatter ───────────────────────────────────────────────────────

async function handleCommand(cmd: ParsedCommand): Promise<string> {
  switch (cmd.type) {
    case "generate": {
      // Find first channel if none specified
      let channelId: string;
      if (cmd.channelSlug) {
        const ch = await db.channel.findUnique({
          where: { slug: cmd.channelSlug },
        });
        if (!ch) return `Channel "${cmd.channelSlug}" not found. Try: channels`;
        channelId = ch.id;
      } else {
        const ch = await db.channel.findFirst({ where: { status: "ACTIVE" } });
        if (!ch) return `No active channels. Set one up first at ${BASE_URL}`;
        channelId = ch.id;
      }

      const reel = await db.reel.create({
        data: {
          userId: (await db.user.findFirst())!.id,
          channelId,
          prompt: cmd.prompt!,
          status: "PENDING",
        },
        include: { channel: true },
      });

      // Trigger pipeline async
      fetch(`${BASE_URL}/api/agents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          prompt: cmd.prompt,
          reelId: reel.id,
        }),
      }).catch(console.error);

      return `🎬 *Reel started!*\n\nPrompt: ${cmd.prompt}\nChannel: ${reel.channel.name}\nID: \`${reel.id.slice(0, 8)}\`\n\nI'll message you when it's ready. Track at:\n${BASE_URL}/dashboard`;
    }

    case "status": {
      const [total, pending, ready, failed] = await Promise.all([
        db.reel.count(),
        db.reel.count({
          where: {
            status: {
              in: [
                "PENDING",
                "SCRIPTING",
                "GENERATING_IMAGES",
                "ANIMATING",
                "POST_PRODUCTION",
              ],
            },
          },
        }),
        db.reel.count({ where: { status: "READY" } }),
        db.reel.count({ where: { status: "FAILED" } }),
      ]);
      const channels = await db.channel.count({ where: { status: "ACTIVE" } });

      return `📊 *Kalki Status*\n\n🎬 Reels: ${total} total\n⏳ In progress: ${pending}\n✅ Ready: ${ready}\n❌ Failed: ${failed}\n📺 Active channels: ${channels}\n\n🌐 Dashboard: ${BASE_URL}`;
    }

    case "channels": {
      const channels = await db.channel.findMany({
        where: { status: "ACTIVE" },
      });
      if (!channels.length) return "No active channels yet.";
      const list = channels
        .map((c) => `• *${c.name}* — ${c.theme.replace(/_/g, " ")}`)
        .join("\n");
      return `📺 *Your Channels*\n\n${list}\n\nTo generate: "reel about X for [channel name]"`;
    }

    case "reels": {
      const reels = await db.reel.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { channel: true },
      });
      if (!reels.length)
        return "No reels yet. Try: generate reel about <topic>";
      const list = reels
        .map(
          (r) =>
            `• ${r.status === "READY" ? "✅" : r.status === "FAILED" ? "❌" : "⏳"} ${r.prompt?.slice(0, 40)}... (${r.channel.name})`,
        )
        .join("\n");
      return `🎬 *Recent Reels*\n\n${list}\n\nFull library: ${BASE_URL}/library`;
    }

    case "help":
      return `🦞 *Kalki Commands*\n\n🎬 *Generate reel:*\ngenerate reel about <topic>\nreel: <topic> for gen z\n\n📊 *Check status:*\nstatus\n\n📺 *List channels:*\nchannels\n\n🎞️ *Recent reels:*\nreels\n\n🗺️ *Project roadmap:*\nroadmap\n\n⚙️ *Dev control:*\nbuild — compile app\ndeploy — build + PM2 restart\nlogs — tail last 20 lines\ncommit: <msg> — git commit all\npush — git push master\npull — git pull latest\n\nAll commands work in natural language!`;

    default:
      return `I didn't understand that. Try:\n• "generate reel about [topic]"\n• "status"\n• "build" / "deploy"\n• "help"`;
  }
}

// ─── OpenClaw Webhook Endpoint ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const expected = process.env.KALKI_WEBHOOK_SECRET;
    const owner = process.env.WHATSAPP_OWNER_NUMBER?.replace(/\D/g, "");
    if (!expected || !owner) {
      return NextResponse.json(
        { error: "WhatsApp control is not configured." },
        { status: 503 },
      );
    }
    if (!safeEqual(req.headers.get("x-kalki-secret") ?? "", expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message: string = body.message ?? body.text ?? "";
    const from: string = body.from ?? "";

    // Only accept from the configured owner number (exact match)
    if (from.replace(/\D/g, "") !== owner) {
      return NextResponse.json({ reply: "Access denied." });
    }

    const cmd = parseCommand(message);
    const reply = await handleCommand(cmd);

    return NextResponse.json({ reply, success: true });
  } catch (err) {
    console.error("[whatsapp] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", service: "kalki-whatsapp" });
}
