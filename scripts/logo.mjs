// Builds every logo asset from one definition, then renders the PNGs.
// The mark: Shiva's tripundra (three ash lines) crossed by the opened third
// eye, a play triangle for its pupil, and the tip of Kalki's sword above.
// Usage: node scripts/logo.mjs
import { chromium } from "@playwright/test";
import { copyFileSync, writeFileSync } from "fs";

const ORANGE = "#ff7a1f";
const LIGHT = "#ffa25e";
const MID = "#c9530f";
const DEEP = "#9c3d0c";
const INK = "#050f16";

const EYE = "M32 8 C45.5 19 45.5 45 32 56 C18.5 45 18.5 19 32 8z";
const IRIS = "M32 11.5 C42.6 21 42.6 43 32 52.5 C21.4 43 21.4 21 32 11.5z";
const BLADE = "M32 0.5 L34.2 6.4 L32 8.6 L29.8 6.4z";
const PUPIL = "M28.2 24.5v15l12.6-7.5z";
const bars = (fill) =>
  [19, 29.5, 40]
    .map(
      (y) =>
        `<rect x="6" y="${y}" width="52" height="5.5" rx="2.75" fill="${fill}"/>`,
    )
    .join("");
const silhouette = (fill) =>
  `${bars(fill)}<path fill="${fill}" d="${EYE}"/><path fill="${fill}" d="${BLADE}"/>`;

function face() {
  return [
    bars(ORANGE),
    `<path fill="${ORANGE}" d="${EYE}"/>`,
    `<path fill="${LIGHT}" d="${BLADE}"/>`,
    `<path fill="${INK}" d="${IRIS}"/>`,
    `<path transform="translate(0.9 0.9)" fill="${DEEP}" d="${PUPIL}"/>`,
    `<path fill="${ORANGE}" d="${PUPIL}"/>`,
  ].join("");
}

// Flat-shaded extrusion: the silhouette stacked in fine steps toward the lower right.
function mark3d() {
  const layers = [];
  for (let k = 60; k > 0; k--) {
    const d = (k * 0.1).toFixed(1);
    layers.push(
      `<g transform="translate(${d} ${d})">${silhouette(k > 12 ? DEEP : MID)}</g>`,
    );
  }
  return layers.join("") + face();
}

const svg = (viewBox, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Kalki">${body}</svg>\n`;

writeFileSync("public/logo.svg", svg("2 -1 60 62", face()));
writeFileSync("public/logo-3d.svg", svg("2 -1 64 66", mark3d()));
copyFileSync("public/logo-3d.svg", "src/app/icon.svg");
writeFileSync(
  ".github/assets/banner.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" role="img" aria-label="Kalki, open-source AI short-video studio">
<rect width="1280" height="320" fill="${INK}"/>
<g transform="translate(96 44) scale(3.6)">${mark3d()}</g>
<text x="372" y="178" fill="#f2f4f5" font-family="Schibsted Grotesk, Helvetica, Arial, sans-serif" font-weight="800" font-size="124" letter-spacing="-6">Kalki</text>
<text x="376" y="234" fill="${ORANGE}" font-family="Schibsted Grotesk, Helvetica, Arial, sans-serif" font-weight="600" font-size="30">One line of text in. A finished vertical video out.</text>
</svg>
`,
);

const browser = await chromium.launch();
for (const [src, out, w, h, bg] of [
  [
    "public/logo-3d.svg",
    ".github/assets/logo-3d.png",
    1024,
    1024,
    "transparent",
  ],
  [".github/assets/banner.svg", ".github/assets/banner.png", 1280, 320, INK],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const { readFileSync } = await import("fs");
  const markup = readFileSync(src, "utf8").replace(
    "<svg ",
    `<svg width="${w}" height="${h}" `,
  );
  await page.setContent(
    `<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@600;800&display=swap" rel="stylesheet"><style>html,body{margin:0;background:${bg}}</style>${markup}`,
    { waitUntil: "networkidle" },
  );
  await page.screenshot({ path: out, omitBackground: bg === "transparent" });
}
await browser.close();
console.log("logo assets written");
