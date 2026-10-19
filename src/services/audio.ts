/**
 * Audio / TTS service for Project Kalki.
 * Generates voiceover audio using ElevenLabs v1 API (eleven_multilingual_v2).
 * Falls back to empty string if ELEVENLABS_API_KEY is not set.
 * Audio files are saved to public/audio/{reelId}.mp3 and served as /audio/{reelId}.mp3.
 */

import fs from "fs";
import path from "path";

// ─── Voice ID Map ─────────────────────────────────────────────────────────────

/**
 * ElevenLabs voice IDs.
 * Rachel (EXAVITQu4vr4xnSDxMaL) — English, calm narrator
 * Aria  (9BWtsMINqrJLrRacOk9x)  — multilingual, energetic
 */
const VOICE_MAP: Record<string, string> = {
  ENGLISH: "EXAVITQu4vr4xnSDxMaL", // Rachel
  HINDI: "9BWtsMINqrJLrRacOk9x", // Aria
  HINGLISH: "9BWtsMINqrJLrRacOk9x", // Aria
  MARATHI: "9BWtsMINqrJLrRacOk9x", // Aria
};

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel

function getVoiceForLanguage(language: string): string {
  return VOICE_MAP[language?.toUpperCase()] ?? DEFAULT_VOICE_ID;
}

// ─── Ensure audio output directory exists ────────────────────────────────────

function ensureAudioDir(): string {
  // Resolve relative to the Next.js project root
  const publicAudioDir = path.join(process.cwd(), "public", "audio");
  if (!fs.existsSync(publicAudioDir)) {
    fs.mkdirSync(publicAudioDir, { recursive: true });
  }
  return publicAudioDir;
}

// ─── Public: Generate Voiceover ──────────────────────────────────────────────

/**
 * Generates a voiceover MP3 for the given script text.
 * Saves to public/audio/{reelId}.mp3.
 * Returns the public URL path /audio/{reelId}.mp3 on success, or "" on failure/skip.
 *
 * @param script      - The full voiceover text to synthesise.
 * @param language    - Language key: ENGLISH | HINDI | HINGLISH | MARATHI.
 * @param reelId      - Used as the output file name.
 */
export async function generateVoiceover(
  script: string,
  language: string,
  reelId: string,
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set.");

  if (!script || script.trim().length === 0) {
    console.warn("[audio] Empty script provided — skipping voiceover");
    return "";
  }

  const voiceId = getVoiceForLanguage(language);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
    }

    // Response body is raw MP3 binary
    const audioBuffer = await response.arrayBuffer();

    // Write to disk: public/audio/{reelId}.mp3
    const audioDir = ensureAudioDir();
    const fileName = `${reelId}.mp3`;
    const filePath = path.join(audioDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    const publicUrl = `/audio/${fileName}`;
    console.log(`[audio] Voiceover saved: ${filePath} → ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("[audio] Voiceover generation failed:", err);
    return "";
  }
}
