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

test("hero recording can be paused", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator(".vid-toggle");
  await toggle.click();
  await expect(toggle).toHaveText("Play");
  expect(
    await page
      .locator("video.shot")
      .evaluate((v: HTMLVideoElement) => v.paused),
  ).toBe(true);
});

test("skip link jumps to the content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});
