import { defineConfig, devices } from "@playwright/test";

// E2E_MODE=site runs against a KALKI_SITE_ONLY build (no database).
// E2E_MODE=app runs against a full build with a migrated, seeded database.
const mode = process.env.E2E_MODE ?? "site";
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  testMatch: mode === "app" ? "app.spec.ts" : "site.spec.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `bun run start --port ${port}`,
    url: `http://localhost:${port}/docs/getting-started`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: mode === "site" ? { KALKI_SITE_ONLY: "1" } : {},
  },
});
