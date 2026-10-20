import { expect, test } from "@playwright/test";

const email = process.env.SEED_OWNER_EMAIL ?? "owner@kalki.test";
const password = process.env.SEED_OWNER_PASSWORD ?? "e2e-password-123";

test.describe.configure({ mode: "serial" });

test("the API refuses anonymous callers", async ({ request }) => {
  for (const [method, path] of [
    ["POST", "/api/agents/generate"],
    ["GET", "/api/reels"],
    ["GET", "/api/sse?reelId=x"],
    ["GET", "/api/characters/similar?prompt=x"],
    ["GET", "/api/settings/providers"],
  ] as const) {
    const res = await request.fetch(path, {
      method,
      data: method === "POST" ? {} : undefined,
    });
    expect(res.status(), path).toBe(401);
  }
});

test("the WhatsApp webhook stays closed until configured", async ({
  request,
}) => {
  const res = await request.post("/api/whatsapp", {
    data: { message: "status", from: "1" },
  });
  expect(res.status()).toBe(503);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin/);
});

test("the owner can sign in and walk every page", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Studio Overview")).toBeVisible();

  for (const [path, text] of [
    ["/generate", "Generate Reel"],
    ["/channels", "Karma Reels"],
    ["/characters", "Characters"],
    ["/worlds", "Worlds"],
    ["/library", "Library"],
    ["/agents", "Agent Monitor"],
    ["/settings", "Settings"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByText(text).first()).toBeVisible();
  }

  const status = await page.request.get("/api/settings/providers");
  expect(status.status()).toBe(200);
  const body = await status.json();
  expect(Object.values(body).every((v) => typeof v === "boolean")).toBe(true);
});

test("a new sign-up waits for approval", async ({ page, request }) => {
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E",
      email: `e2e-${Date.now()}@kalki.test`,
      password: "pending-pass-1",
    },
  });
  expect(res.status()).toBe(201);
  expect((await res.json()).message).toMatch(/approval/i);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Idea to Short",
  );
});
