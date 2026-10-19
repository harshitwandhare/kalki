import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ─── Soul Document helper type ────────────────────────────────────────────────

interface SoulDocument {
  name: string;
  age: number | string;
  appearance: string;
  personality: string[];
  voice: string;
  costume: string;
  quirks: string[];
  backstory: string;
}

// ─── Upsert character by name+channelId ───────────────────────────────────────

async function upsertCharacter(params: {
  channelId: string;
  name: string;
  soulDocument: SoulDocument;
  referenceUrls?: string[];
}) {
  const existing = await db.character.findFirst({
    where: { channelId: params.channelId, name: params.name },
  });

  if (existing) {
    return db.character.update({
      where: { id: existing.id },
      data: {
        soulDocument: params.soulDocument as never,
        referenceUrls: params.referenceUrls ?? [],
      },
    });
  }

  return db.character.create({
    data: {
      channelId: params.channelId,
      name: params.name,
      soulDocument: params.soulDocument as never,
      referenceUrls: params.referenceUrls ?? [],
    },
  });
}

// ─── Upsert world by name+channelId ───────────────────────────────────────────

async function upsertWorld(params: {
  channelId: string;
  name: string;
  description: string;
  visualStyle: string;
  referenceUrls?: string[];
}) {
  const existing = await db.world.findFirst({
    where: { channelId: params.channelId, name: params.name },
  });

  if (existing) {
    return db.world.update({
      where: { id: existing.id },
      data: {
        description: params.description,
        visualStyle: params.visualStyle,
        referenceUrls: params.referenceUrls ?? [],
      },
    });
  }

  return db.world.create({
    data: {
      channelId: params.channelId,
      name: params.name,
      description: params.description,
      visualStyle: params.visualStyle,
      referenceUrls: params.referenceUrls ?? [],
    },
  });
}

// ─── Main Seed ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Kalki database...\n");

  // ── Owner user ──────────────────────────────────────────────────────────────
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  if (!ownerEmail || !ownerPassword || ownerPassword.length < 12) {
    throw new Error(
      "Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD (12+ chars) before seeding.",
    );
  }
  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const user = await db.user.upsert({
    where: { email: ownerEmail },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      email: ownerEmail,
      name: "Owner",
      passwordHash,
      role: "OWNER",
      status: "ACTIVE",
    },
  });
  console.log(`✓ User: ${user.email}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Channel 1: Viral India
  // ─────────────────────────────────────────────────────────────────────────────
  const channelA = await db.channel.upsert({
    where: { slug: "indian-gen-z" },
    update: {},
    create: {
      userId: user.id,
      name: "Viral India",
      slug: "indian-gen-z",
      theme: "INDIAN_GEN_Z",
      targetAudience: "Indian Gen Z 18-25",
      language: "HINDI",
      description: "Financial Nihilism and Gen Z Lifestyle",
      aboutText:
        "Daily shorts about money, life hacks, and relatable Gen Z moments. Hindi/Hinglish content.",
      config: {
        defaultStyle: "REALISTIC_HUMAN",
        defaultDuration: 45,
        audioStyle: "trending-bollywood-remix",
        videoStyle: "REALISTIC_HUMAN",
        hooks: ["Did you know...", "POV:", "This is why you're broke"],
      },
    },
  });
  console.log(`✓ Channel: ${channelA.name} (${channelA.slug})`);

  // Characters for Viral India
  const aryan = await upsertCharacter({
    channelId: channelA.id,
    name: "Aryan",
    soulDocument: {
      name: "Aryan",
      age: 22,
      appearance:
        "Lean 22-year-old with messy black hair and a permanent under-eye shadow from late nights. Sharp jawline, dark brown eyes that always look slightly sleep-deprived. Medium brown skin tone, 5'10\".",
      personality: [
        "financially anxious but outwardly chill",
        "self-deprecating humour",
        "aspirational",
        "loyal to friends",
        "impulsive shopper despite being broke",
      ],
      voice:
        "Mid-pitched, casual Hinglish with quick switches between Hindi and English slang. Uses 'bhai', 'yaar', 'bro', 'sahi hai' naturally.",
      costume:
        "Oversized graphic hoodie (usually one of three rotating colours: grey, black, navy), jogger pants or slim-fit jeans, worn-out white sneakers. Always has earphones hanging around neck.",
      quirks: [
        "checks UPI balance before every purchase even street food",
        "has 12 unread notifications from loan-app ads",
        "orders chai 3 times a day minimum",
        "screenshots every meme to send later but never does",
        "pretends to be more broke than he is for relatability",
      ],
      backstory:
        "Aryan moved from Jaipur to Delhi for college, surviving on a tight monthly allowance while trying to look like he belongs to a richer crowd.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${aryan.name}`);

  const priya = await upsertCharacter({
    channelId: channelA.id,
    name: "Priya",
    soulDocument: {
      name: "Priya",
      age: 21,
      appearance:
        "Petite 21-year-old Mumbai girl with highlighted brown hair (subtle caramel streaks), expressive dark eyes with bold kohl liner, and a confident posture. Olive skin tone, 5'4\".",
      personality: [
        "sarcastic but loveable",
        "bold and direct",
        "hyper-aware of aesthetics",
        "ambitious influencer mindset",
        "low tolerance for mediocrity",
      ],
      voice:
        "Fast-paced, confident Hinglish with Mumbai flair. Drops English phrases mid-sentence, often ends statements with upward inflection. Uses 'literally', 'no but seriously', 'okay so'.",
      costume:
        "Trendy co-ord sets, crop tops with high-waist jeans, oversized blazers over bralettes. Always in platform sneakers or chunky boots. Minimal gold jewellery. Phone in hand or tucked in jacket pocket.",
      quirks: [
        "films everything for potential content before experiencing it",
        "rates every meal before eating it",
        "has 17 shooting locations saved on Google Maps",
        "corrects everyone's English grammar passive-aggressively",
        "refreshes Instagram insights every 20 minutes",
      ],
      backstory:
        "Priya grew up in a middle-class Mumbai family who wanted her to become an engineer, but she quietly built an Instagram following of 40K while pretending to study.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${priya.name}`);

  // World for Viral India
  const worldA = await upsertWorld({
    channelId: channelA.id,
    name: "Delhi Streets & Gen Z Haunts",
    description:
      "Crowded Delhi streets alive with auto rickshaws and street vendors, busy metro stations with packed rush-hour carriages, iconic chai tapri with plastic stools and steaming kullad chai, college campus gates and canteens buzzing with Gen Z energy, neon-lit night markets glowing in purples and pinks.",
    visualStyle:
      "Hyper-real urban Indian aesthetic. High saturation, warm orange-tinted street lighting at night, chaotic but vibrant. 9:16 vertical framing. Authentic Gen Z POV shots.",
    referenceUrls: [],
  });
  console.log(`  ✓ World: ${worldA.name}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Channel 2: Parent Pulse
  // ─────────────────────────────────────────────────────────────────────────────
  const channelB = await db.channel.upsert({
    where: { slug: "us-parents" },
    update: {},
    create: {
      userId: user.id,
      name: "Parent Pulse",
      slug: "us-parents",
      theme: "US_PARENTS",
      targetAudience: "US Parents 30-45",
      language: "ENGLISH",
      description: "Holistic Parenting and Burnout Recovery",
      aboutText:
        "Science-backed parenting tips, family wellness, and recharge moments for busy US parents.",
      config: {
        defaultStyle: "STORYTELLING",
        defaultDuration: 60,
        audioStyle: "calm-ambient",
        videoStyle: "STORYTELLING",
        hooks: [
          "As a parent of 3...",
          "Stop doing this to your kids",
          "Harvard says...",
        ],
      },
    },
  });
  console.log(`✓ Channel: ${channelB.name} (${channelB.slug})`);

  // Characters for Parent Pulse
  const sarah = await upsertCharacter({
    channelId: channelB.id,
    name: "Sarah",
    soulDocument: {
      name: "Sarah",
      age: 38,
      appearance:
        "Warm 38-year-old suburban mom with naturally wavy auburn hair usually pulled into a messy bun. Soft hazel eyes with smile lines forming. Comfortable build, 5'6\". Rosy cheeks from constant motion.",
      personality: [
        "overwhelmed but deeply caring",
        "warm and empathetic",
        "self-deprecating about parenting fails",
        "secretly hilarious",
        "desperately seeks 10 minutes alone",
      ],
      voice:
        "Soft, approachable American accent with a warm Midwest friendliness. Speaks in measured, slightly tired cadence but lights up when talking about her kids. Uses 'honestly', 'I mean', 'like genuinely'.",
      costume:
        "High-waist yoga pants (usually grey or navy), oversized athletic zip-up hoodie, comfortable Hoka sneakers. Hair clip instead of hair tie. Always has a tote bag with snacks spilling out.",
      quirks: [
        "announces she's taking 5 minutes for herself then lasts 90 seconds",
        "stress-organises the pantry at 11pm",
        "sends voice memos to her sister about everything",
        "has 3 half-drunk cold coffees on the counter",
        "apologises to her plants when they die",
      ],
      backstory:
        "Sarah left her marketing career to raise three kids and still hasn't fully made peace with the identity shift, channelling her creative energy into neighbourhood community boards and very aesthetic bento box lunches.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${sarah.name}`);

  const mike = await upsertCharacter({
    channelId: channelB.id,
    name: "Mike",
    soulDocument: {
      name: "Mike",
      age: 40,
      appearance:
        "Stocky 40-year-old with close-cropped dark brown hair greying at temples, a neat beard maintained out of minimal effort, and kind blue-grey eyes behind thin-frame glasses. 5'11\".",
      personality: [
        "perpetually distracted by work",
        "genuinely trying to be present",
        "anxious about money/future",
        "dad-joke enthusiast",
        "over-researches everything",
      ],
      voice:
        "Calm, measured, slightly monotone East Coast accent. Speaks with deliberate pauses. Prone to starting sentences with 'So the thing is...' or 'According to what I read...'",
      costume:
        "Branded hoodie or quarter-zip pullover, khaki or dark chino joggers, slippers or white New Balance. Laptop on lap or beside him at all times. Signature ceramic mug branded from a startup he worked at 6 years ago.",
      quirks: [
        "joins every video call 3 minutes early and just sits there",
        "googles every parenting question at 2am",
        "tracks family spending in three separate spreadsheets",
        "mutes himself on Zoom and then keeps talking",
        "buys productivity books that remain unread on the shelf",
      ],
      backstory:
        "Mike worked in fintech before going fully remote, gaining flexibility but losing the separation between work and home life — a balance he desperately narrates on family vlogs he never finishes editing.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${mike.name}`);

  // World for Parent Pulse
  const worldB = await upsertWorld({
    channelId: channelB.id,
    name: "Suburban Family Life",
    description:
      "Warm suburban home with a lived-in feeling — couch cushions askew, LEGO on the carpet, crayon drawings on the fridge. Cosy living room with soft lamps and toy clutter. Backyard patio with a gas grill and plastic lawn chairs. School pickup line with minivans and coffee cups. Kitchen island that doubles as homework central command.",
    visualStyle:
      "Warm, soft-focus suburban Americana. Golden hour lighting indoors. Clean but not sterile. Authentic imperfection — slightly cluttered surfaces, natural light from large windows. Cinematic but approachable.",
    referenceUrls: [],
  });
  console.log(`  ✓ World: ${worldB.name}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Channel 3: Karma Reels
  // ─────────────────────────────────────────────────────────────────────────────
  const channelC = await db.channel.upsert({
    where: { slug: "motivation-karma" },
    update: {},
    create: {
      userId: user.id,
      name: "Karma Reels",
      slug: "motivation-karma",
      theme: "MOTIVATION_KARMA",
      targetAudience: "Global 18-45",
      language: "ENGLISH",
      description: "Karma Justice and Retribution Stories",
      aboutText:
        "When karma strikes back — motivational stories, legal wins, and cosmic justice. Daily shorts.",
      config: {
        defaultStyle: "CINEMATIC",
        defaultDuration: 58,
        audioStyle: "epic-orchestral",
        videoStyle: "CINEMATIC",
        hooks: ["What goes around...", "Justice was served", "God's plan:"],
      },
    },
  });
  console.log(`✓ Channel: ${channelC.name} (${channelC.slug})`);

  // Characters for Karma Reels
  const justice = await upsertCharacter({
    channelId: channelC.id,
    name: "Justice",
    soulDocument: {
      name: "Justice",
      age: "ageless",
      appearance:
        "Tall, indeterminate-age figure draped in a deep charcoal hooded cloak that seems to absorb light. Only the lower half of their face is visible — sharp, angular jaw, pale skin, calm eyes that seem to shift between amber and silver depending on the scene. 6'2\" commanding presence.",
      personality: [
        "omniscient but patient",
        "deeply just without being cold",
        "speaks only when it matters",
        "unsettling wisdom",
        "benevolent but final",
      ],
      voice:
        "Deep, resonant baritone with a slight echo quality, like sound is arriving from both near and far. Measured pace, each word deliberate. Never raises voice. Uses archaic phrasing mixed with plain truth.",
      costume:
        "Full-length deep charcoal hooded robe with subtle geometric patterns only visible in certain light. No visible shoes. Hands either clasped or holding a small balanced scale made of dark metal.",
      quirks: [
        "appears at the edge of scenes slightly out of focus",
        "never explains — just observes and states outcome",
        "tilts head exactly 15 degrees before speaking",
        "candles flicker when they enter a room",
        "leaves no footprints",
      ],
      backstory:
        "Justice has existed since the first lie was told, a universal force given form to remind humanity that every action echoes forward in time.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${justice.name}`);

  const villain = await upsertCharacter({
    channelId: channelC.id,
    name: "The Villain",
    soulDocument: {
      name: "The Villain",
      age: 52,
      appearance:
        "Silver-haired 52-year-old with the practiced look of someone who bought their way into every room. Sharp, angular features — a predatory jaw and laser-focused grey eyes that calculate rather than see. Manicured hands, perfect posture, permanent half-smile. 6'0\".",
      personality: [
        "charming on the surface, predatory beneath",
        "transactional in every relationship",
        "genuinely believes rules don't apply to them",
        "pathologically image-conscious",
        "underestimates everyone",
      ],
      voice:
        "Smooth, polished American accent with boardroom authority. Confident cadence, never hesitates. Uses jargon to obscure and power words to dominate. Laughs at the wrong moments.",
      costume:
        "Perfectly fitted charcoal or navy bespoke suit, subtle pinstripe. Solid silk tie in deep burgundy or dark gold. Understated Patek Philippe watch. Pocket square, always. Shoes you could eat your reflection off.",
      quirks: [
        "straightens things on desks that don't belong to them",
        "checks phone during moments of human vulnerability",
        "uses first names strategically to create false intimacy",
        "golf tan on hands only",
        "pauses before answering to appear thoughtful rather than be it",
      ],
      backstory:
        "A self-made executive who climbed to the top by stepping on everyone within reach, now sitting in a glass tower certain that consequence is something that happens to lesser people.",
    },
    referenceUrls: [],
  });
  console.log(`  ✓ Character: ${villain.name}`);

  // World for Karma Reels
  const worldC = await upsertWorld({
    channelId: channelC.id,
    name: "Karma's Domain",
    description:
      "Corporate boardroom lined with glass walls overlooking a grey city skyline, sterile conference tables with leather chairs and name plates. Dramatic wood-panelled courtroom with high ceilings, gallery benches, and a judge's imposing bench. Rain-slicked city streets at night reflecting neon signs in puddles, deserted intersections lit only by traffic lights cycling through empty air.",
    visualStyle:
      "Cinematic dark drama. High contrast, muted cool palette punctuated by dramatic warm light shafts. Deep shadows, shallow depth of field. Slow deliberate camera movements. Think prestige crime drama meets cosmic justice documentary.",
    referenceUrls: [],
  });
  console.log(`  ✓ World: ${worldC.name}`);

  // ─────────────────────────────────────────────────────────────────────────────

  console.log("\n✅ Seed complete!");
  console.log(`Owner account: ${ownerEmail}`);
  console.log("\nChannels seeded:");
  console.log(`  - ${channelA.name} (${channelA.theme})`);
  console.log(`  - ${channelB.name} (${channelB.theme})`);
  console.log(`  - ${channelC.name} (${channelC.theme})`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
