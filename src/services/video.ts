/**
 * Video animation service for Project Kalki.
 * Animates scene images into video clips using Seedance 2.0 (ByteDance) or Kling AI.
 * Falls back to empty string if neither API key is set.
 */

import type { ScriptOutput } from "@/types/agents";

// ─── Seedance 2.0 (ByteDance / Doubao) ───────────────────────────────────────

const SEEDANCE_POLL_INTERVAL_MS = 5_000;
const SEEDANCE_MAX_POLLS = 60; // 5 min max

async function animateWithSeedance(
  imageUrls: string[],
  script: ScriptOutput,
  apiKey: string,
  characterReferenceUrls?: string[],
): Promise<string> {
  // Build prompt — prepend @url references for character consistency (up to 12)
  let prompt = script.voiceoverScript;
  if (characterReferenceUrls && characterReferenceUrls.length > 0) {
    const refs = characterReferenceUrls.slice(0, 12);
    const refPrefix = refs.map((url) => `@${url}`).join(" ");
    prompt = `${refPrefix} ${prompt}`;
    console.log(
      `[video] Seedance: injecting ${refs.length} character reference(s) into prompt`,
    );
  }

  // Submit image-to-video job
  const submitResponse = await fetch(
    "https://api.doubao.com/cv/v1/video_generation",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "seedance-2.0",
        task_type: "img2video",
        input: {
          prompt,
          images: imageUrls.map((url) => ({ url })),
          duration: script.targetDuration,
          aspect_ratio: "9:16",
          audio_style: script.audioStyle,
        },
      }),
    },
  );

  if (!submitResponse.ok) {
    const errText = await submitResponse.text();
    throw new Error(
      `Seedance submit error ${submitResponse.status}: ${errText}`,
    );
  }

  const submitData = await submitResponse.json();
  const jobId: string =
    submitData.task_id ?? submitData.job_id ?? submitData.id;

  if (!jobId) {
    throw new Error("Seedance did not return a job ID");
  }

  console.log(`[video] Seedance job submitted: ${jobId}`);

  // Poll for completion
  for (let attempt = 0; attempt < SEEDANCE_MAX_POLLS; attempt++) {
    await sleep(SEEDANCE_POLL_INTERVAL_MS);

    const pollResponse = await fetch(
      `https://api.doubao.com/cv/v1/video_generation/${jobId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    if (!pollResponse.ok) {
      console.warn(
        `[video] Seedance poll ${attempt + 1} failed: ${pollResponse.status}`,
      );
      continue;
    }

    const pollData = await pollResponse.json();
    const status: string = pollData.status ?? pollData.task_status ?? "";

    console.log(`[video] Seedance poll ${attempt + 1}: status=${status}`);

    if (
      status === "SUCCESS" ||
      status === "COMPLETED" ||
      status === "success"
    ) {
      const videoUrl: string =
        pollData.output?.video_url ??
        pollData.video_url ??
        pollData.result?.url ??
        "";
      console.log(`[video] Seedance complete: ${videoUrl}`);
      return videoUrl;
    }

    if (status === "FAILED" || status === "ERROR" || status === "failed") {
      throw new Error(
        `Seedance job failed: ${JSON.stringify(pollData.error ?? pollData.message)}`,
      );
    }
  }

  throw new Error("Seedance job timed out after maximum polling attempts");
}

// ─── Kling AI Fallback ───────────────────────────────────────────────────────

const KLING_POLL_INTERVAL_MS = 5_000;
const KLING_MAX_POLLS = 60;

async function animateWithKling(
  imageUrls: string[],
  script: ScriptOutput,
): Promise<string> {
  const apiKey = process.env.KLING_API_KEY!;

  // Use the first image as the reference image for image-to-video
  const referenceImage = imageUrls[0] ?? "";

  const submitResponse = await fetch(
    "https://api.klingai.com/v1/videos/image2video",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "kling-v2",
        image: referenceImage,
        prompt: script.voiceoverScript,
        duration: Math.min(script.targetDuration, 10), // Kling max is 10s per clip
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
      }),
    },
  );

  if (!submitResponse.ok) {
    const errText = await submitResponse.text();
    throw new Error(`Kling submit error ${submitResponse.status}: ${errText}`);
  }

  const submitData = await submitResponse.json();
  const taskId: string =
    submitData.data?.task_id ?? submitData.task_id ?? submitData.id ?? "";

  if (!taskId) {
    throw new Error("Kling AI did not return a task ID");
  }

  console.log(`[video] Kling task submitted: ${taskId}`);

  // Poll for completion
  for (let attempt = 0; attempt < KLING_MAX_POLLS; attempt++) {
    await sleep(KLING_POLL_INTERVAL_MS);

    const pollResponse = await fetch(
      `https://api.klingai.com/v1/videos/image2video/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    if (!pollResponse.ok) {
      console.warn(
        `[video] Kling poll ${attempt + 1} failed: ${pollResponse.status}`,
      );
      continue;
    }

    const pollData = await pollResponse.json();
    const status: string =
      pollData.data?.task_status ??
      pollData.task_status ??
      pollData.status ??
      "";

    console.log(`[video] Kling poll ${attempt + 1}: status=${status}`);

    if (
      status === "succeed" ||
      status === "SUCCESS" ||
      status === "completed"
    ) {
      const videoUrl: string =
        pollData.data?.task_result?.videos?.[0]?.url ??
        pollData.data?.video_url ??
        pollData.video_url ??
        "";
      console.log(`[video] Kling complete: ${videoUrl}`);
      return videoUrl;
    }

    if (status === "failed" || status === "FAILED") {
      throw new Error(
        `Kling task failed: ${JSON.stringify(pollData.data?.task_status_msg ?? pollData.message)}`,
      );
    }
  }

  throw new Error("Kling AI task timed out after maximum polling attempts");
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public: Animate Scenes ──────────────────────────────────────────────────

/**
 * Animates an array of scene images into a single video.
 * Tries Seedance 2.0 first, falls back to Kling AI.
 * Returns empty string if no API keys are configured.
 *
 * @param sceneImages - URLs of generated scene images
 * @param script - pipeline script output
 * @param reelId - reel ID for logging
 * @param characterReferenceUrls - optional character reference URLs injected as @url tags (up to 12)
 */
export async function animateScenes(
  sceneImages: string[],
  script: ScriptOutput,
  reelId: string,
  characterReferenceUrls?: string[],
): Promise<string> {
  if (!process.env.SEEDANCE_API_KEY && !process.env.KLING_API_KEY) {
    throw new Error(
      "No video API key set. Provide SEEDANCE_API_KEY or KLING_API_KEY.",
    );
  }

  {
    // Prefer Seedance 2.0
    if (process.env.SEEDANCE_API_KEY) {
      try {
        console.log(`[video] Animating reel ${reelId} via Seedance 2.0`);
        const url = await animateWithSeedance(
          sceneImages,
          script,
          process.env.SEEDANCE_API_KEY,
          characterReferenceUrls,
        );
        return url;
      } catch (err) {
        console.error("[video] Seedance animation failed:", err);
        if (!process.env.KLING_API_KEY) {
          return ""; // No fallback available
        }
        console.log("[video] Falling back to Kling AI...");
      }
    }

    // Kling AI fallback
    if (process.env.KLING_API_KEY) {
      try {
        console.log(`[video] Animating reel ${reelId} via Kling AI`);
        const url = await animateWithKling(sceneImages, script);
        return url;
      } catch (err) {
        console.error("[video] Kling AI animation failed:", err);
        return "";
      }
    }
  }

  return "";
}
