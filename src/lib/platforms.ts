// Publishing presets. Every Kalki reel is a 9:16 H.264/AAC MP4, which all of
// these accept; what differs is the caption. Limits are deliberately on the
// conservative side so a generated caption always fits.

export type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "pinterest"
  | "x"
  | "linkedin";

export interface Platform {
  id: PlatformId;
  name: string;
  /** Characters allowed in the caption or description we produce. */
  captionLimit: number;
  /** Separate title field, if the platform has one. */
  titleLimit?: number;
  hashtagLimit: number;
  uploadUrl: string;
  /** Where the platform's AI disclosure lives. */
  disclosure: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    name: "YouTube Shorts",
    titleLimit: 100,
    captionLimit: 5000,
    hashtagLimit: 3,
    uploadUrl: "https://studio.youtube.com",
    disclosure:
      'Set "Altered or synthetic content" to Yes in the upload details.',
  },
  {
    id: "tiktok",
    name: "TikTok",
    captionLimit: 2200,
    hashtagLimit: 5,
    uploadUrl: "https://www.tiktok.com/tiktokstudio/upload",
    disclosure: 'Turn on "AI-generated content" under More options.',
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    captionLimit: 2200,
    hashtagLimit: 5,
    uploadUrl: "https://www.instagram.com",
    disclosure: 'Turn on "AI label" in Advanced settings.',
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    captionLimit: 2200,
    hashtagLimit: 5,
    uploadUrl: "https://www.facebook.com/reels/create",
    disclosure: 'Turn on the "AI info" label before you share.',
  },
  {
    id: "snapchat",
    name: "Snapchat Spotlight",
    captionLimit: 160,
    hashtagLimit: 3,
    uploadUrl: "https://my.snapchat.com",
    disclosure: "Say it is AI-generated in the caption.",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    titleLimit: 100,
    captionLimit: 500,
    hashtagLimit: 5,
    uploadUrl: "https://www.pinterest.com/idea-pin-builder",
    disclosure: "Say it is AI-generated in the description.",
  },
  {
    id: "x",
    name: "X",
    captionLimit: 280,
    hashtagLimit: 2,
    uploadUrl: "https://x.com/compose/post",
    disclosure: "Add a note that the video is AI-generated.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    captionLimit: 3000,
    hashtagLimit: 3,
    uploadUrl: "https://www.linkedin.com/feed",
    disclosure: "Say it is AI-generated in the post text.",
  },
];

export interface ReelMeta {
  title: string | null;
  description: string | null;
  tags: string[];
}

export interface Caption {
  title?: string;
  caption: string;
}

const AI_NOTE = "Made with AI.";

function hashtag(tag: string): string {
  const word = tag.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "");
  return word ? `#${word}` : "";
}

function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Builds a caption that fits the platform, always ending with the AI note. */
export function buildCaption(platform: Platform, meta: ReelMeta): Caption {
  const title = (meta.title ?? "").trim();
  const description = (meta.description ?? "").trim();
  const tags = [...new Set(meta.tags.map(hashtag).filter(Boolean))].slice(
    0,
    platform.hashtagLimit,
  );
  const tail = [AI_NOTE, tags.join(" ")].filter(Boolean).join(" ");

  // Platforms with a title field get the title there and the description below.
  const body = platform.titleLimit
    ? description
    : [title, description].filter(Boolean).join("\n\n");
  const room = platform.captionLimit - tail.length - 2;
  const caption =
    room > 0 && body
      ? `${clip(body, room)}\n\n${tail}`
      : clip(tail, platform.captionLimit);

  return platform.titleLimit
    ? { title: clip(title, platform.titleLimit), caption }
    : { caption };
}
