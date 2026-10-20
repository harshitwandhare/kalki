// Records a short silent walkthrough of a running local instance.
// Usage: node scripts/record.mjs http://localhost:3030 email password
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const [base, email, password] = process.argv.slice(2);
mkdirSync(".rec", { recursive: true });
const browser = await chromium.launch();
const login = await browser.newPage();
await login.goto(`${base}/auth/signin`);
await login.fill('input[type="email"]', email);
await login.fill('input[type="password"]', password);
await login.click('button[type="submit"]');
await login.waitForURL(/dashboard/, { timeout: 60000 });
const state = await login.context().storageState();
await login.close();

const ctx = await browser.newContext({
  storageState: state,
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: ".rec", size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
const visit = async (p, ms = 1800) => {
  await page.goto(`${base}/${p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(ms);
};
await visit("dashboard");
await visit("generate", 600);
await page.click("textarea");
await page.keyboard.type(
  "Why compound interest is the most boring way to get rich",
  { delay: 35 },
);
await page.waitForTimeout(1200);
await visit("channels");
await visit("characters");
await visit("worlds");
await visit("agents");
await ctx.close();
await browser.close();
console.log("done");
