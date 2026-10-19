/**
 * Image generation service for Project Kalki.
 * Generates images for each scene using Stability AI's SDXL model.
 * Uses the STABILITY_API_KEY you supply.
 */
import fs from "fs/promises";
import path from "path";
import type { Scene } from "@/types/agents";

// ─── Style Prefix Map ─────────────────────────────────────────────────────────

const STYLE_PREFIXES: Record<string, string> = {
  CINEMATIC: "cinematic film still",
  CARTOON: "cartoon illustration",
  AI_GENERATED: "highly detailed AI art",
  REALISTIC: "photorealistic",
  ANIME: "anime art style",
};

function getStylePrefix(style: string): string {
  return STYLE_PREFIXES[style?.toUpperCase()] ?? "cinematic film still";
}

// ─── Single Image via Stability AI ──────────────────────────────────────────

async function generateImageFromStability(
  prompt: string,
  style: string,
  apiKey: string,
): Promise<string> {
  const stylePrefix = getStylePrefix(style);
  const engineId = "stable-diffusion-xl-1024-v1-0";

  const response = await fetch(
    `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: `${prompt}, ${stylePrefix}, ultra HD, cinematic`,
          },
        ],
        cfg_scale: 7,
        height: 1920,
        width: 1080,
        steps: 30,
        samples: 1,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    artifacts: Array<{ base64: string; seed: number; finishReason: string }>;
  };

  const image = data.artifacts[0];
  if (!image) {
    throw new Error("Stability API did not return an image.");
  }

  // Save the base64 image to a file
  const buffer = Buffer.from(image.base64, "base64");
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
  const imagePath = path.join(
    process.cwd(),
    "public/images/generated",
    filename,
  );

  await fs.writeFile(imagePath, buffer);

  // Return the public URL
  return `/images/generated/${filename}`;
}

// ─── Public: Generate Scene Images ───────────────────────────────────────────

/**
 * Generates one image per scene.
 */
export async function generateSceneImages(
  scenes: Scene[],
  style: string,
): Promise<string[]> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not set.");

  const results = await Promise.all(
    scenes.map(async (scene, i) => {
      try {
        const url = await generateImageFromStability(
          scene.visualPrompt,
          style,
          apiKey,
        );
        console.log(
          `[image] Scene ${i + 1}/${scenes.length} generated: ${url}`,
        );
        return url;
      } catch (err) {
        console.error(`[image] Scene ${i + 1} failed, using placeholder:`, err);
        return `https://picsum.photos/seed/${i}/1080/1920`;
      }
    }),
  );

  return results;
}

// ─── Public: Generate Thumbnail ──────────────────────────────────────────────

/**
 * Generates a single thumbnail image from a prompt.
 */
export async function generateThumbnail(
  prompt: string,
  style: string,
): Promise<string> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not set.");

  try {
    const url = await generateImageFromStability(prompt, style, apiKey);
    console.log(`[image] Thumbnail generated: ${url}`);
    return url;
  } catch (err) {
    console.error(
      "[image] Thumbnail generation failed, using placeholder:",
      err,
    );
    return "https://picsum.photos/seed/thumbnail/1080/1920";
  }
}
