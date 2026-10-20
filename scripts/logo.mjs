// Builds every logo asset from one definition, then renders the PNGs.
// The mark: three horizontal lines (Shiva's tripundra) crossed by one open eye.
// Usage: node scripts/logo.mjs
import { chromium } from "@playwright/test";
import { copyFileSync, readFileSync, writeFileSync } from "fs";

const ORANGE = "#ff7a1f";
const INK = "#050f16";

// A vesica (pointed oval) centred on x=32, as a cubic Bezier path.
const vesica = (top, bottom, half) => {
  const mid = (top + bottom) / 2;
  const k = (bottom - top) * 0.32;
  return `M32 ${top} C${32 + half} ${mid - k} ${32 + half} ${mid + k} 32 ${bottom} C${32 - half} ${mid + k} ${32 - half} ${mid - k} 32 ${top}Z`;
};

const EYE = vesica(9, 55, 15);
const IRIS = vesica(14, 50, 10.5);
const GAP = vesica(5, 59, 19.5);
const LINES = [19.5, 29.5, 39.5];

/** The mark on its own. `id` keeps mask ids unique when several marks share a page. */
function mark(id = "k") {
  const lines = LINES.map(
    (y) => `<rect x="4" y="${y}" width="56" height="5" rx="2.5"/>`,
  ).join("");
  return [
    `<defs><mask id="${id}"><rect width="64" height="64" fill="#fff"/><path d="${GAP}" fill="#000"/></mask></defs>`,
    `<g fill="${ORANGE}" mask="url(#${id})">${lines}</g>`,
    `<path fill="${ORANGE}" fill-rule="evenodd" d="${EYE} ${IRIS}"/>`,
    `<circle cx="32" cy="32" r="5.5" fill="${ORANGE}"/>`,
  ].join("");
}

const svg = (viewBox, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Kalki"${extra}>${body}</svg>\n`;

// Transparent mark: site header, README.
writeFileSync("public/logo.svg", svg("0 0 64 64", mark()));
// App icon: the mark on an ink tile so it reads on any tab colour.
writeFileSync(
  "src/app/icon.svg",
  svg(
    "0 0 64 64",
    `<rect width="64" height="64" rx="14" fill="${INK}"/><g transform="translate(6 6) scale(0.8125)">${mark("i")}</g>`,
  ),
);
// README banner.
writeFileSync(
  ".github/assets/banner.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" role="img" aria-label="Kalki, open-source AI short-video studio">
<rect width="1280" height="320" fill="${INK}"/>
<g transform="translate(112 64) scale(3)">${mark("b")}</g>
<text x="352" y="178" fill="#f2f4f5" font-family="Schibsted Grotesk, Helvetica, Arial, sans-serif" font-weight="800" font-size="124" letter-spacing="-6">Kalki</text>
<text x="356" y="232" fill="${ORANGE}" font-family="Schibsted Grotesk, Helvetica, Arial, sans-serif" font-weight="600" font-size="30">One line of text in. A finished vertical video out.</text>
</svg>
`,
);

const browser = await chromium.launch();
for (const [src, out, w, h, bg] of [
  ["public/logo.svg", ".github/assets/logo.png", 512, 512, "transparent"],
  ["src/app/icon.svg", "src/app/apple-icon.png", 180, 180, "transparent"],
  [".github/assets/banner.svg", ".github/assets/banner.png", 1280, 320, INK],
]) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: out.endsWith("banner.png") ? 2 : 1,
  });
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
copyFileSync(".github/assets/logo.png", "public/logo.png");
console.log("logo assets written");
