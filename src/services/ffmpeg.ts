import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

const FFMPEG_BIN =
  process.env.FFMPEG_PATH ?? "D:\\tools\\ffmpeg\\bin\\ffmpeg.exe";

// ─── Run FFmpeg command ───────────────────────────────────────────────────────

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { stdio: "pipe" });
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited ${code}: ${stderr}`));
    });
  });
}

// ─── Provenance metadata ─────────────────────────────────────────────────────

/**
 * Tags the output as AI-generated. Provenance is never stripped or faked:
 * platforms (YouTube, TikTok, Instagram) and several jurisdictions require
 * synthetic media to be disclosed, so Kalki labels it at the file level too.
 */
export async function addDisclosureMetadata(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await runFFmpeg([
    "-i",
    inputPath,
    "-c",
    "copy",
    "-metadata",
    "comment=AI-generated content (created with Kalki)",
    "-metadata",
    "encoder=Kalki",
    "-y",
    outputPath,
  ]);
}

// ─── Merge scenes into final reel ────────────────────────────────────────────

export async function mergeScenes(
  scenePaths: string[],
  audioPath: string,
  outputPath: string,
  durationSeconds: number,
): Promise<void> {
  const tmpDir = path.dirname(outputPath);
  const listFile = path.join(tmpDir, `concat_${Date.now()}.txt`);

  const listContent = scenePaths.map((p) => `file '${p}'`).join("\n");
  await fs.writeFile(listFile, listContent);

  await runFFmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    String(durationSeconds),
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  ]);

  await fs.unlink(listFile).catch(() => null);
}

// ─── Generate thumbnail ───────────────────────────────────────────────────────

export async function extractThumbnail(
  videoPath: string,
  outputPath: string,
  timeSeconds = 1,
): Promise<void> {
  await runFFmpeg([
    "-i",
    videoPath,
    "-ss",
    String(timeSeconds),
    "-vframes",
    "1",
    "-q:v",
    "2",
    "-y",
    outputPath,
  ]);
}

// ─── Full post-production pipeline ───────────────────────────────────────────

export async function runPostProduction(params: {
  scenePaths: string[];
  audioPath: string;
  outputDir: string;
  reelId: string;
  durationSeconds: number;
}): Promise<{ videoPath: string; thumbnailPath: string }> {
  const { scenePaths, audioPath, outputDir, reelId, durationSeconds } = params;

  await fs.mkdir(outputDir, { recursive: true });

  const mergedPath = path.join(outputDir, `${reelId}_merged.mp4`);
  const finalPath = path.join(outputDir, `${reelId}_final.mp4`);
  const thumbnailPath = path.join(outputDir, `${reelId}_thumb.jpg`);

  // Step 1: Merge all scene videos with audio
  await mergeScenes(scenePaths, audioPath, mergedPath, durationSeconds);

  // Step 2: Label the file as AI-generated
  await addDisclosureMetadata(mergedPath, finalPath);

  // Step 3: Extract thumbnail
  await extractThumbnail(finalPath, thumbnailPath);

  // Cleanup intermediates
  await Promise.allSettled([fs.unlink(mergedPath)]);

  return { videoPath: finalPath, thumbnailPath };
}
