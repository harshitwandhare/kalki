import { expect, test } from "@playwright/test";

const docs = [
  "getting-started",
  "configuration",
  "pipeline",
  "architecture",
  "api",
  "deployment",
  "publishing",
  "earning",
  "responsible-use",
];

test("landing page renders the pitch and the five agents", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Kalki/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Idea to Short",
  );
  for (const agent of [
    "Director",
    "Screenwriter",
    "Artist",
    "Animator",
    "Producer",
  ]) {
    await expect(
      page.locator(".stack").getByText(agent, { exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator("video.shot")).toHaveAttribute(
    "src",
    "/screens/tour.mp4",
  );
  expect(errors).toEqual([]);
});

test("channel switch swaps the seeded channel", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#channels");
  await expect(section.getByText("Aryan, 22")).toBeVisible();
  await section.getByRole("button", { name: "Karma Reels" }).click();
  await expect(
    section.getByRole("button", { name: "Karma Reels" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByText("The Villain")).toBeVisible();
  await expect(section.getByRole("heading", { level: 2 })).toHaveText(
    "One studio, a drama channel",
  );
});

test("every screenshot and the recording load", async ({ page, request }) => {
  await page.goto("/");
  const srcs = await page
    .locator("img, video")
    .evaluateAll((els) =>
      els
        .map((e) => e.getAttribute("src"))
        .filter((s): s is string => !!s && s.startsWith("/")),
    );
  expect(srcs.length).toBeGreaterThan(8);
  for (const src of new Set(srcs)) {
    const res = await request.get(src);
    expect(res.status(), src).toBe(200);
  }
});

for (const slug of docs) {
  test(`docs: ${slug} renders`, async ({ page }) => {
    const res = await page.goto(`/docs/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator(".prose h1")).toBeVisible();
    await expect(
      page.locator(`nav[aria-label="Documentation"] a[aria-current="page"]`),
    ).toHaveCount(1);
  });
}

test("docs index redirects to getting started", async ({ page }) => {
  await page.goto("/docs");
  await expect(page).toHaveURL(/\/docs\/getting-started$/);
});

test("app routes redirect home and the API is closed in site mode", async ({
  page,
  request,
}) => {
  for (const path of ["/dashboard", "/generate", "/auth/signin", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
  const api = await request.get("/api/reels");
  expect(api.status()).toBe(404);
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
});

test("social preview image is served", async ({ page, request }) => {
  await page.goto("/");
  const og = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(og).toBeTruthy();
  const res = await request.get(new URL(og!).pathname + new URL(og!).search);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("publish section lists every platform preset", async ({ page }) => {
  await page.goto("/");
  const feeds = page.locator("#publish .feeds li");
  await expect(feeds).toHaveCount(8);
  for (const name of [
    "YouTube Shorts",
    "TikTok",
    "Instagram Reels",
    "Facebook Reels",
  ]) {
    await expect(
      page.locator("#publish").getByText(name, { exact: true }),
    ).toBeVisible();
  }
});

test("hero recording control matches the video state", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator(".vid-toggle");
  const video = page.locator("video.shot");
  const isPaused = () => video.evaluate((v: HTMLVideoElement) => v.paused);
  // Headless Linux Chromium may refuse to play H.264, so start from whatever state it is in.
  await expect(toggle).toHaveText((await isPaused()) ? "Play" : "Pause");
  if (!(await isPaused())) {
    await toggle.click();
    await expect(toggle).toHaveText("Play");
    expect(await isPaused()).toBe(true);
  }
});

test("skip link jumps to the content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});

// A section is "blank" when it is on screen or already scrolled past but still hidden.
const hiddenAboveFold = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".rise:not(.in)"))
      .filter((el) => el.getBoundingClientRect().top < window.innerHeight)
      .map((el) => el.textContent?.trim().slice(0, 40) ?? "(image)"),
  );

test("jumping to a section from a hero folder leaves nothing blank", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".stack a.folder").first().click();
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
  // Jump straight to the bottom, then back up: nothing skipped may stay hidden.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
});

test("coming back to the home page from the docs renders every section", async ({
  page,
}) => {
  await page.goto("/docs/api");
  await page.locator("header.nav .brand").click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
});

test("navigating docs to a home anchor shows the target section", async ({
  page,
}) => {
  await page.goto("/docs/api");
  // The footer link exists on phones too, where the header links are hidden.
  await page.locator('footer a[href="/#pipeline"]').click();
  await expect(page).toHaveURL(/#pipeline$/);
  await page.waitForTimeout(900);
  expect(await hiddenAboveFold(page)).toEqual([]);
  await expect(page.locator("#pipeline .seg").first()).toBeVisible();
});
