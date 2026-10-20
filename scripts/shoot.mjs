// Captures dashboard screenshots from a running local instance.
// Usage: node scripts/shoot.mjs http://localhost:3030 email password
import { chromium } from "@playwright/test";

const [base, email, password] = process.argv.slice(2);
const pages = [
  "dashboard",
  "generate",
  "channels",
  "characters",
  "worlds",
  "library",
  "agents",
  "settings",
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(`${base}/auth/signin`);
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL(/dashboard/, { timeout: 60000 });
for (const p of pages) {
  await page.goto(`${base}/${p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `public/screens/${p}.png` });
  console.log("shot", p);
}
await browser.close();
