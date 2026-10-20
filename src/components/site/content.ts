// Landing-page content. Channel and cast data mirror prisma/seed.ts.

export const channels = [
  {
    name: "Viral India",
    word: "a Hinglish",
    field: "#ffffff",
    ink: "#050f16",
    night: false,
    description: "Money, life hacks and relatable Gen Z moments",
    audience: "Indian Gen Z, 18 to 25",
    language: "Hindi and Hinglish",
    duration: 45,
    hooks: ["Did you know...", "POV:", "This is why you're broke"],
    cast: [
      {
        name: "Aryan, 22",
        line: "Moved from Jaipur to Delhi for college, surviving on a tight monthly allowance while trying to look like he belongs to a richer crowd.",
        traits: [
          "financially anxious but outwardly chill",
          "self-deprecating",
          "aspirational",
        ],
      },
      {
        name: "Priya, 21",
        line: "Grew up in a middle-class Mumbai family who wanted an engineer, and quietly built a 40K Instagram following while pretending to study.",
        traits: [
          "sarcastic but loveable",
          "bold and direct",
          "hyper-aware of aesthetics",
        ],
      },
    ],
  },
  {
    name: "Parent Pulse",
    word: "a parenting",
    field: "#ffb27a",
    ink: "#050f16",
    night: false,
    description: "Parenting tips and burnout recovery",
    audience: "US parents, 30 to 45",
    language: "English",
    duration: 60,
    hooks: [
      "As a parent of 3...",
      "Stop doing this to your kids",
      "Harvard says...",
    ],
    cast: [
      {
        name: "Sarah",
        line: "Left a marketing career to raise three kids and still hasn't made peace with the identity shift.",
        traits: [
          "overwhelmed but deeply caring",
          "warm and empathetic",
          "laughs at her own fails",
        ],
      },
      {
        name: "Mike",
        line: "Went fully remote after fintech and lost the line between work and home, which he narrates on vlogs he never finishes editing.",
        traits: [
          "distracted by work",
          "trying to be present",
          "anxious about money",
        ],
      },
    ],
  },
  {
    name: "Karma Reels",
    word: "a drama",
    field: "#13232e",
    ink: "#f2f4f5",
    night: true,
    description: "Karma, justice and retribution stories",
    audience: "Global, 18 to 45",
    language: "English",
    duration: 60,
    hooks: ["What goes around...", "Justice was served", "God's plan:"],
    cast: [
      {
        name: "Justice",
        line: "Has existed since the first lie was told, a force given form to remind people that every action echoes forward.",
        traits: [
          "omniscient but patient",
          "just without being cold",
          "speaks only when it matters",
        ],
      },
      {
        name: "The Villain",
        line: "A self-made executive in a glass tower, certain that consequences happen to lesser people.",
        traits: [
          "charming, predatory beneath",
          "transactional",
          "above the rules",
        ],
      },
    ],
  },
];

export const stages = [
  {
    name: "Director",
    out: "1 research pass",
    w: 1,
    c: "#ffffff",
    t: "#050f16",
    note: "First, the Director reads the prompt, researches the topic and picks the channel, cast and world.",
  },
  {
    name: "Screenwriter",
    out: "Script and metadata",
    w: 2,
    c: "#ffb27a",
    t: "#050f16",
    note: "Then the Screenwriter (Gemini) writes the hook, scenes and voiceover, plus title, description and tags.",
  },
  {
    name: "Artist",
    out: "1 image per scene",
    w: 4,
    c: "#eef0f1",
    t: "#050f16",
    note: "Next, the Artist draws every scene with Stability AI, plus a thumbnail.",
  },
  {
    name: "Animator",
    out: "1 video job",
    w: 2,
    c: "#13232e",
    t: "#f2f4f5",
    note: "The Animator sends scenes to Seedance or Kling with up to 12 character references.",
  },
  {
    name: "Producer",
    out: "3 FFmpeg passes",
    w: 3,
    c: "#050f16",
    t: "#ff7a1f",
    note: "Last, the Producer merges video and ElevenLabs voice, labels the file and cuts a thumbnail.",
  },
];

export const tour = [
  {
    slug: "dashboard",
    title: "Overview",
    note: "Reel counts, channels and the five agents at a glance.",
  },
  {
    slug: "generate",
    title: "Generate",
    note: "Prompt, channel, language, style, length. Then watch it run.",
  },
  {
    slug: "agents",
    title: "Agent monitor",
    note: "Every agent step, logged to Postgres and streamed live.",
  },
  {
    slug: "channels",
    title: "Channels",
    note: "Audience, language and hooks for each channel you run.",
  },
  {
    slug: "characters",
    title: "Characters",
    note: "A recurring cast with soul documents and reference images.",
  },
  {
    slug: "worlds",
    title: "Worlds",
    note: "Settings and visual style, searchable by meaning with pgvector.",
  },
  {
    slug: "library",
    title: "Library",
    note: "Finished reels with their title, description and tags.",
  },
  {
    slug: "settings",
    title: "Settings",
    note: "Providers, output folder and the WhatsApp gateway.",
  },
];

export const parts = [
  { name: "Next.js 16", role: "App Router, server routes, SSE" },
  { name: "LangGraph.js", role: "The five-node agent graph" },
  { name: "Prisma 7", role: "Typed schema and migrations" },
  { name: "PostgreSQL + pgvector", role: "Data and similarity search" },
  { name: "NextAuth v5", role: "Sign-in, roles, approvals" },
  { name: "FFmpeg", role: "Merge, label, thumbnail" },
  { name: "Gemini 2.5 Pro", role: "Research, scripts, embeddings" },
  { name: "Bun", role: "Install, run, test" },
];

export const quickstart = `git clone https://github.com/harshitwandhare/kalki && cd kalki
cp .env.example .env.local      # add AUTH_SECRET and your API keys
bun install
export POSTGRES_PASSWORD=change-me
bun run db:up
bunx prisma migrate deploy
SEED_OWNER_EMAIL=you@example.com SEED_OWNER_PASSWORD='a-long-password' bun run db:seed
bun run dev`;
