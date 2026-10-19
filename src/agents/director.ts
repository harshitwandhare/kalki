import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { emitSSEEvent, emitSSEError } from "@/services/sse";
import { generateSceneImages, generateThumbnail } from "@/services/image";
import { animateScenes } from "@/services/video";
import { generateVoiceover } from "@/services/audio";
import { runPostProduction } from "@/services/ffmpeg";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";
import type {
  PipelineState,
  AgentPhase,
  ScriptOutput,
  YouTubeMetadata,
} from "@/types/agents";

// ─── LangGraph State Annotation ─────────────────────────────────────────────

const PipelineAnnotation = Annotation.Root({
  reelId: Annotation<string>(),
  channelId: Annotation<string>(),
  prompt: Annotation<string>(),
  style: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  language: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  phase: Annotation<AgentPhase>({
    reducer: (_, next) => next,
    default: () => "IDLE",
  }),
  script: Annotation<PipelineState["script"]>({
    reducer: (_, next) => next,
  }),
  sceneImages: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  videoUrl: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  audioUrl: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  thumbnailUrl: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  ytMetadata: Annotation<PipelineState["ytMetadata"]>({
    reducer: (_, next) => next,
  }),
  pipelineContext: Annotation<Record<string, unknown> | undefined>({
    reducer: (_, next) => next,
  }),
  error: Annotation<string | undefined>({
    reducer: (_, next) => next,
  }),
  logs: Annotation<PipelineState["logs"]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

type GraphState = typeof PipelineAnnotation.State;

// ─── DB Agent Log Helper ─────────────────────────────────────────────────────

async function logToDb(params: {
  reelId: string;
  agent: "DIRECTOR" | "SCREENWRITER" | "ARTIST" | "ANIMATOR" | "PRODUCER";
  action: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  durationMs?: number;
}) {
  try {
    await db.agentLog.create({
      data: {
        reelId: params.reelId,
        agent: params.agent,
        action: params.action,
        status: params.status,
        durationMs: params.durationMs,
        input: params.input
          ? (params.input as Prisma.InputJsonValue)
          : undefined,
        output: params.output
          ? (params.output as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (e) {
    console.error("[logToDb] Failed to write agent log:", e);
  }
}

// ─── Gemini 2.5 Pro Text Helper (PRIMARY) ──────────────────────────────────

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  );
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── Invoke LLM with Gemini 2.5 Pro ──────────────────────────────────────────

async function invokeWithFallback(
  systemContent: string,
  userContent: string,
): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
  try {
    console.log("[director] Invoking Gemini 2.5 Pro");
    return await generateWithGemini(
      `${systemContent}\n\nReturn JSON only (no markdown fences).\n\n${userContent}`,
    );
  } catch (err) {
    throw new Error(`Gemini 2.5 Pro failed: ${(err as Error).message}`);
  }
}

// ─── Node: Research Phase ────────────────────────────────────────────────────

async function researchNode(state: GraphState): Promise<Partial<GraphState>> {
  const startMs = Date.now();
  const ts = new Date().toISOString();
  const event = {
    reelId: state.reelId,
    agent: "DIRECTOR" as const,
    action: "Starting algorithm research phase",
    phase: "RESEARCHING" as const,
    timestamp: ts,
  };

  await logToDb({
    ...event,
    input: { prompt: state.prompt },
    status: "RUNNING",
  });
  emitSSEEvent(state.reelId, event);

  let pipelineContext: Record<string, unknown> = {};

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      const result = await model.generateContent(
        `Research trending YouTube Shorts content for: "${state.prompt}". ` +
          `Return JSON only (no markdown fences): { "trendingAngles": string[], "algorithmTips": string[], "targetEmotion": string }`,
      );

      const text = result.response.text();
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? [
        null,
        text,
      ];
      const parsed = JSON.parse(jsonMatch[1] ?? text);

      pipelineContext = {
        trendingAngles: parsed.trendingAngles ?? [],
        algorithmTips: parsed.algorithmTips ?? [],
        targetEmotion: parsed.targetEmotion ?? "",
      };

      console.log("[research] Gemini research complete:", pipelineContext);
    } catch (err) {
      const errorMessage = `[research] Gemini research failed: ${(err as Error).message}`;
      console.error(errorMessage);
      emitSSEError(state.reelId, errorMessage);
    }
  } else {
    console.warn(
      "[research] GOOGLE_GENERATIVE_AI_API_KEY not set — skipping Gemini research",
    );
  }

  await logToDb({
    reelId: state.reelId,
    agent: "DIRECTOR",
    action: "Research complete → routing to Screenwriter",
    output: pipelineContext,
    status: "COMPLETED",
    durationMs: Date.now() - startMs,
  });

  return {
    phase: "SCRIPTING",
    pipelineContext,
    logs: [
      {
        reelId: state.reelId,
        agent: "DIRECTOR",
        action: "Research complete → routing to Screenwriter",
        phase: "SCRIPTING",
        data: pipelineContext,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Node: Script Generation ─────────────────────────────────────────────────

async function scriptNode(state: GraphState): Promise<Partial<GraphState>> {
  const startMs = Date.now();
  const ts = new Date().toISOString();
  const event = {
    reelId: state.reelId,
    agent: "SCREENWRITER" as const,
    action: "Generating script and hook",
    phase: "SCRIPTING" as const,
    timestamp: ts,
  };

  await logToDb({
    ...event,
    input: { prompt: state.prompt, language: state.language },
    status: "RUNNING",
  });
  emitSSEEvent(state.reelId, event);

  // ── 1. Generate the reel script (Claude preferred, Gemini fallback) ────────
  const scriptContent = await invokeWithFallback(
    `You are the Screenwriter agent for Project Kalki.
Generate a high-engagement YouTube Shorts script optimized for the algorithm.
Return valid JSON only (no markdown fences) matching this shape:
{ "title": string, "hook": string, "scenes": [...], "emotionalTags": string[], "targetDuration": number, "audioStyle": string, "voiceoverScript": string }`,
    `Create a reel script for: "${state.prompt}"
Language: ${state.language ?? "ENGLISH"}
Requirements:
- Hook grabs attention in under 2 seconds
- Optimize for watch-time completion
- Include emotional triggers for the target audience`,
  );

  let script: ScriptOutput;
  try {
    const jsonMatch = scriptContent.match(/```json\n?([\s\S]*?)\n?```/) ?? [
      null,
      scriptContent,
    ];
    script = JSON.parse(jsonMatch[1] ?? scriptContent) as ScriptOutput;
  } catch (err) {
    const errorMessage = `[script] Failed to parse LLM script output: ${(err as Error).message}`;
    console.error(errorMessage);
    emitSSEError(state.reelId, errorMessage);
    script = {
      title: "Generated Reel (fallback)",
      hook: state.prompt,
      scenes: [],
      emotionalTags: [],
      targetDuration: 60,
      audioStyle: "upbeat",
      voiceoverScript: state.prompt,
    };
  }

  // ── 2. Generate YouTube metadata ───────────────────────────────────────────
  let ytMetadata: YouTubeMetadata | undefined;
  try {
    const ytContent = await invokeWithFallback(
      "Generate YouTube Shorts metadata optimised for the algorithm. Return JSON only (no markdown fences).",
      `Generate YouTube metadata for: title="${script.title}", hook="${script.hook}".
Return: { "title": string, "description": string, "tags": string[], "category": string, "audienceAge": string, "thumbnailPrompt": string }`,
    );

    const ytJsonMatch = ytContent.match(/```json\n?([\s\S]*?)\n?```/) ?? [
      null,
      ytContent,
    ];
    ytMetadata = JSON.parse(ytJsonMatch[1] ?? ytContent) as YouTubeMetadata;

    await db.reel.update({
      where: { id: state.reelId },
      data: {
        script: script as unknown as Prisma.InputJsonValue,
        ytTitle: ytMetadata.title,
        ytDescription: ytMetadata.description,
        ytTags: ytMetadata.tags,
        ytCategory: ytMetadata.category,
        ytAudienceAge: ytMetadata.audienceAge,
        status: "SCRIPTING",
      },
    });
  } catch (err) {
    const errorMessage = `[script] YT metadata generation failed: ${(err as Error).message}`;
    console.error(errorMessage);
    emitSSEError(state.reelId, errorMessage);
    await db.reel.update({
      where: { id: state.reelId },
      data: {
        script: script as unknown as Prisma.InputJsonValue,
        status: "SCRIPTING",
      },
    });
  }

  await logToDb({
    reelId: state.reelId,
    agent: "SCREENWRITER",
    action: `Script generated: "${script.title}"`,
    output: { title: script.title, scenes: script.scenes?.length ?? 0 },
    status: "COMPLETED",
    durationMs: Date.now() - startMs,
  });

  return {
    phase: "GENERATING_IMAGES",
    script,
    ytMetadata,
    logs: [
      {
        reelId: state.reelId,
        agent: "SCREENWRITER",
        action: `Script generated: "${script?.title}"`,
        phase: "SCRIPTING",
        data: script,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Node: Image Generation ──────────────────────────────────────────────────

async function artistNode(state: GraphState): Promise<Partial<GraphState>> {
  const startMs = Date.now();
  const ts = new Date().toISOString();
  const event = {
    reelId: state.reelId,
    agent: "ARTIST" as const,
    action: `Generating images for ${state.script?.scenes?.length ?? 0} scenes`,
    phase: "GENERATING_IMAGES" as const,
    timestamp: ts,
  };

  await logToDb({
    ...event,
    input: { style: state.style, sceneCount: state.script?.scenes?.length },
    status: "RUNNING",
  });
  emitSSEEvent(state.reelId, event);

  const style = state.style ?? "CINEMATIC";
  let images: string[] = [];
  let thumbnail: string | undefined;

  try {
    images = await generateSceneImages(state.script?.scenes ?? [], style);
  } catch (err) {
    const errorMessage = `[artist] Scene image generation failed: ${(err as Error).message}`;
    console.error(errorMessage);
    emitSSEError(state.reelId, errorMessage);
    images = (state.script?.scenes ?? []).map(
      (_, i) => `https://picsum.photos/seed/${i}/1080/1920`,
    );
  }

  try {
    thumbnail = await generateThumbnail(
      state.script?.scenes[0]?.visualPrompt ?? state.prompt,
      style,
    );
  } catch (err) {
    const errorMessage = `[artist] Thumbnail generation failed: ${(err as Error).message}`;
    console.error(errorMessage);
    emitSSEError(state.reelId, errorMessage);
    thumbnail = `https://picsum.photos/seed/thumb-${state.reelId}/1280/720`;
  }

  await db.reel
    .update({
      where: { id: state.reelId },
      data: { thumbnailUrl: thumbnail, status: "GENERATING_IMAGES" },
    })
    .catch((e) => console.error("[artist] DB update failed:", e));

  await logToDb({
    reelId: state.reelId,
    agent: "ARTIST",
    action: `Images generated (${images.length} scenes)`,
    output: { imageCount: images.length, thumbnail },
    status: "COMPLETED",
    durationMs: Date.now() - startMs,
  });

  return {
    phase: "ANIMATING",
    sceneImages: images,
    thumbnailUrl: thumbnail,
    logs: [
      {
        reelId: state.reelId,
        agent: "ARTIST",
        action: `Images generated (${images.length} scenes) → routing to Animator`,
        phase: "GENERATING_IMAGES",
        data: { imageCount: images.length, thumbnail },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Node: Video Animation ───────────────────────────────────────────────────

async function animatorNode(state: GraphState): Promise<Partial<GraphState>> {
  const startMs = Date.now();
  const event = {
    reelId: state.reelId,
    agent: "ANIMATOR" as const,
    action: "Submitting scenes to Seedance 2.0",
    phase: "ANIMATING" as const,
    timestamp: new Date().toISOString(),
  };

  await logToDb({
    ...event,
    input: { imageCount: state.sceneImages?.length },
    status: "RUNNING",
  });
  emitSSEEvent(state.reelId, event);

  const language = state.language ?? "ENGLISH";
  let videoUrl: string | undefined;
  let audioUrl: string | undefined;

  // Fetch character reference URLs for Seedance @ reference system
  let characterReferenceUrls: string[] = [];
  try {
    const reelCharacters = await db.reelCharacter.findMany({
      where: { reelId: state.reelId },
      include: { character: { select: { referenceUrls: true } } },
    });
    characterReferenceUrls = reelCharacters
      .flatMap((rc) => rc.character.referenceUrls)
      .filter((url): url is string => Boolean(url));
    if (characterReferenceUrls.length > 0) {
      console.log(
        `[animator] Found ${characterReferenceUrls.length} character reference URL(s) for reel ${state.reelId}`,
      );
    }
  } catch (err) {
    const errorMessage = `[animator] Failed to fetch character references: ${(err as Error).message}`;
    console.warn(errorMessage);
    emitSSEError(state.reelId, errorMessage);
  }

  try {
    [videoUrl, audioUrl] = await Promise.all([
      animateScenes(
        state.sceneImages ?? [],
        state.script!,
        state.reelId,
        characterReferenceUrls.length > 0 ? characterReferenceUrls : undefined,
      ).then((url) => url || undefined),
      generateVoiceover(
        state.script?.voiceoverScript ?? "",
        language,
        state.reelId,
      ).then((url) => url || undefined),
    ]);
  } catch (err) {
    const errorMessage = `[animator] Animation/audio failed: ${(err as Error).message}`;
    console.error(errorMessage);
    emitSSEError(state.reelId, errorMessage);
  }

  await db.reel
    .update({
      where: { id: state.reelId },
      data: { videoUrl: videoUrl ?? null, status: "ANIMATING" },
    })
    .catch((e) => console.error("[animator] DB update failed:", e));

  await logToDb({
    reelId: state.reelId,
    agent: "ANIMATOR",
    action: "Animation complete → routing to Producer",
    output: { videoUrl, audioUrl },
    status: "COMPLETED",
    durationMs: Date.now() - startMs,
  });

  return {
    phase: "POST_PRODUCTION",
    videoUrl,
    audioUrl,
    logs: [
      {
        reelId: state.reelId,
        agent: "ANIMATOR",
        action: "Animation complete → routing to Producer",
        phase: "ANIMATING",
        data: { videoUrl, audioUrl },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Node: Post Production ───────────────────────────────────────────────────

async function producerNode(state: GraphState): Promise<Partial<GraphState>> {
  const startMs = Date.now();
  const event = {
    reelId: state.reelId,
    agent: "PRODUCER" as const,
    action: "Running FFmpeg post-production pipeline",
    phase: "POST_PRODUCTION" as const,
    timestamp: new Date().toISOString(),
  };

  await logToDb({
    ...event,
    input: { hasVideo: !!state.videoUrl, hasAudio: !!state.audioUrl },
    status: "RUNNING",
  });
  emitSSEEvent(state.reelId, event);

  let finalVideoUrl = state.videoUrl;

  const localAudioPath = `public/audio/${state.reelId}.mp3`;
  const hasLocalAudio =
    state.audioUrl?.startsWith("/audio/") ||
    state.audioUrl?.includes(state.reelId);

  if (hasLocalAudio && state.sceneImages && state.sceneImages.length > 0) {
    try {
      const outputDir = `public/reels/${state.reelId}`;
      const { videoPath } = await runPostProduction({
        scenePaths: state.sceneImages.filter((u) => u.startsWith("public/")),
        audioPath: localAudioPath,
        outputDir,
        reelId: state.reelId,
        durationSeconds: state.script?.targetDuration ?? 60,
      });
      finalVideoUrl = `/${videoPath.replace(/\\/g, "/").replace(/^public\//, "")}`;
      console.log("[producer] FFmpeg post-production complete:", finalVideoUrl);
    } catch (err) {
      const errorMessage = `[producer] FFmpeg pipeline failed: ${(err as Error).message}`;
      console.error(errorMessage);
      emitSSEError(state.reelId, errorMessage);
    }
  }

  await db.reel
    .update({
      where: { id: state.reelId },
      data: {
        status: "READY",
        videoUrl: finalVideoUrl ?? null,
        pipelineState: {
          complete: true,
          completedAt: new Date().toISOString(),
          ffmpegRan: hasLocalAudio,
        } as unknown as Prisma.InputJsonValue,
      },
    })
    .catch((e) => console.error("[producer] DB status update failed:", e));

  const finalEvent = {
    reelId: state.reelId,
    agent: "PRODUCER" as const,
    action: "Post-production complete. Reel is READY.",
    output: { finalVideoUrl },
    status: "COMPLETED" as const,
    durationMs: Date.now() - startMs,
  };
  await logToDb(finalEvent);

  emitSSEEvent(state.reelId, {
    reelId: state.reelId,
    agent: "PRODUCER",
    action: "upload", // Custom action for client to find URL
    phase: "COMPLETE",
    data: { url: finalVideoUrl },
    timestamp: new Date().toISOString(),
  });

  return {
    phase: "COMPLETE",
    videoUrl: finalVideoUrl,
    logs: [
      {
        reelId: state.reelId,
        agent: "PRODUCER",
        action: "Post-production complete. Reel is ready.",
        phase: "COMPLETE",
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Build the Graph ──────────────────────────────────────────────────────────

export function buildKalkiGraph() {
  const graph = new StateGraph(PipelineAnnotation)
    .addNode("research", researchNode)
    .addNode("script", scriptNode)
    .addNode("artist", artistNode)
    .addNode("animator", animatorNode)
    .addNode("producer", producerNode)
    .addEdge(START, "research")
    .addEdge("research", "script")
    .addEdge("script", "artist")
    .addEdge("artist", "animator")
    .addEdge("animator", "producer")
    .addEdge("producer", END);

  return graph.compile();
}

// ─── Run Pipeline ─────────────────────────────────────────────────────────────

export async function runPipeline(
  reelId: string,
  channelId: string,
  prompt: string,
  style?: string,
  language?: string,
): Promise<GraphState> {
  const app = buildKalkiGraph();

  const initialState: GraphState = {
    reelId,
    channelId,
    prompt,
    style: style ?? "CINEMATIC",
    language: language ?? "ENGLISH",
    phase: "RESEARCHING",
    script: undefined,
    sceneImages: [],
    videoUrl: undefined,
    audioUrl: undefined,
    thumbnailUrl: undefined,
    ytMetadata: undefined,
    pipelineContext: undefined,
    error: undefined,
    logs: [],
  };

  emitSSEEvent(reelId, {
    reelId,
    agent: "DIRECTOR",
    action: `Pipeline started for: "${prompt}"`,
    phase: "RESEARCHING",
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await app.invoke(initialState);
    return result as GraphState;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`[director] Fatal pipeline error for reel ${reelId}:`, error);
    emitSSEError(reelId, `Fatal pipeline error: ${errorMessage}`);
    // Update DB to reflect failed state
    await db.reel.update({
      where: { id: reelId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
