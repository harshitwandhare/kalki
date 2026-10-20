import { db } from "@/lib/prisma";
import { runPipeline } from "@/agents/director";

/** Runs the pipeline in the background. Progress streams over /api/sse. */
export function startPipeline(p: {
  reelId: string;
  channelId: string;
  prompt: string;
  style?: string;
  language?: string;
}): void {
  setImmediate(async () => {
    try {
      await db.reel.update({
        where: { id: p.reelId },
        data: { status: "SCRIPTING" },
      });
      await runPipeline(p.reelId, p.channelId, p.prompt, p.style, p.language);
    } catch (err) {
      console.error("[pipeline] error:", err);
      await db.reel.update({
        where: { id: p.reelId },
        data: { status: "FAILED", pipelineState: { error: String(err) } },
      });
    }
  });
}
