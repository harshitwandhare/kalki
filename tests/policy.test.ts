import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const sources = walk("src")
  .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("generated"))
  .map((f) => ({ f, text: readFileSync(f, "utf8").toLowerCase() }));

describe("project policy", () => {
  it.each([
    "puppeteer-extra-plugin-stealth",
    "capsolver",
    "mail.tm",
    "bypass_mode",
    "map_metadata",
  ])("source never references %s", (needle) => {
    const hits = sources.filter((s) => s.text.includes(needle));
    expect(hits.map((h) => h.f)).toEqual([]);
  });

  it("post-production labels output as AI-generated", () => {
    const ffmpeg = readFileSync("src/services/ffmpeg.ts", "utf8");
    expect(ffmpeg).toContain("AI-generated");
  });
});
