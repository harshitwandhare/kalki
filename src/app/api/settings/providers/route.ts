import { NextResponse } from "next/server";
import { guard } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const PROVIDER_KEYS = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "STABILITY_API_KEY",
  "ELEVENLABS_API_KEY",
  "SEEDANCE_API_KEY",
  "KLING_API_KEY",
  "KALKI_WEBHOOK_SECRET",
] as const;

/** Which provider keys are set. Never returns the values. */
export async function GET() {
  const g = await guard("OWNER");
  if (!g.ok) return g.response;
  return NextResponse.json(
    Object.fromEntries(PROVIDER_KEYS.map((k) => [k, Boolean(process.env[k])])),
  );
}
