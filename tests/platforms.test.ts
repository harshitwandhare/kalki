import { describe, expect, it } from "vitest";
import { buildCaption, PLATFORMS } from "@/lib/platforms";

const long = {
  title: "Why your chai habit costs more than your phone bill ".repeat(4),
  description: "Aryan does the maths on three cups a day. ".repeat(200),
  tags: ["money", "Gen Z", "chai", "budget", "india", "finance", "hinglish"],
};

describe("platform captions", () => {
  it.each(PLATFORMS)("$name: caption and title fit the limits", (p) => {
    const c = buildCaption(p, long);
    expect(c.caption.length).toBeLessThanOrEqual(p.captionLimit);
    if (p.titleLimit) expect(c.title!.length).toBeLessThanOrEqual(p.titleLimit);
    else expect(c.title).toBeUndefined();
  });

  it.each(PLATFORMS)("$name: always carries the AI note", (p) => {
    expect(buildCaption(p, long).caption).toContain("Made with AI.");
  });

  it.each(PLATFORMS)("$name: respects the hashtag cap", (p) => {
    const tags = buildCaption(p, long).caption.match(/#\S+/g) ?? [];
    expect(tags.length).toBeLessThanOrEqual(p.hashtagLimit);
  });

  it("turns tags into clean hashtags and drops duplicates", () => {
    const c = buildCaption(
      PLATFORMS.find((p) => p.id === "tiktok")!,
      {
        title: "t",
        description: "d",
        tags: ["Gen Z", "gen-z!", "", "  "],
      },
    );
    expect(c.caption).toContain("#GenZ");
    expect(c.caption.match(/#\S+/g)).toEqual(["#GenZ", "#genz"]);
  });

  it("puts the title in the caption where there is no title field", () => {
    const c = buildCaption(
      PLATFORMS.find((p) => p.id === "instagram")!,
      {
        title: "Chai maths",
        description: "Three cups a day adds up.",
        tags: [],
      },
    );
    expect(c.caption.startsWith("Chai maths\n\nThree cups")).toBe(true);
  });
});
