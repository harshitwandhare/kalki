// Renders the Kalki emblem with three.js: Shiva's tripundra in dark steel, the
// opened third eye in gold with a burning cosmic iris, a play-triangle pupil,
// and the tip of Kalki's sword above. Writes:
//   .github/assets/logo-3d.png   emblem on its dark field (README, socials)
//   public/logo-3d.png           same, used by the site
//   public/logo-mark.png         transparent, no bloom (small UI placements)
// Usage: node scripts/logo-render.mjs
import { chromium } from "@playwright/test";
import { copyFileSync } from "fs";

const page = (
  transparent,
) => String.raw`<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const TRANSPARENT = ${transparent};
const S = 2048;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: TRANSPARENT, preserveDrawingBuffer: true });
renderer.setSize(S, S);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

// Background: deep ink with a warm halo behind the eye.
if (!TRANSPARENT) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#03080c";
  g.fillRect(0, 0, 1024, 1024);
  const halo = g.createRadialGradient(512, 500, 20, 512, 500, 520);
  halo.addColorStop(0, "rgba(255,122,31,0.22)");
  halo.addColorStop(0.35, "rgba(201,83,15,0.16)");
  halo.addColorStop(1, "rgba(3,8,12,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 140; i++) {
    const a = Math.random() * 0.5;
    g.fillStyle = "rgba(255,210,170," + a + ")";
    g.beginPath();
    g.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 1.4, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
}

// The iris: a burning core with a spiral of embers and stars.
function irisTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#02050a";
  g.fillRect(0, 0, 1024, 1024);
  const core = g.createRadialGradient(512, 512, 0, 512, 512, 430);
  core.addColorStop(0, "rgba(255,240,210,1)");
  core.addColorStop(0.08, "rgba(255,170,80,0.95)");
  core.addColorStop(0.3, "rgba(255,110,25,0.55)");
  core.addColorStop(0.6, "rgba(120,30,90,0.25)");
  core.addColorStop(1, "rgba(2,5,10,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) {
    const arm = i % 2;
    const r = Math.pow(Math.random(), 0.7) * 470;
    const th = r * 0.018 + arm * Math.PI + (Math.random() - 0.5) * 0.9;
    const x = 512 + Math.cos(th) * r;
    const y = 512 + Math.sin(th) * r * 0.62;
    const hot = 1 - r / 470;
    g.fillStyle = "rgba(" + (255) + "," + Math.round(140 + 100 * hot) + "," + Math.round(60 + 160 * Math.random() * hot) + "," + (0.25 + 0.6 * Math.random() * hot) + ")";
    g.beginPath();
    g.arc(x, y, Math.random() * 2.6 + 0.4, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 220; i++) {
    g.fillStyle = "rgba(220,230,255," + Math.random() * 0.9 + ")";
    g.beginPath();
    g.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 1.6, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Brushed-metal streaks for the steel bars.
function brushed() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 1024, 64);
  for (let i = 0; i < 900; i++) {
    const v = 100 + Math.floor(Math.random() * 80);
    g.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.35)";
    g.fillRect(Math.random() * 1024, Math.random() * 64, 80 + Math.random() * 300, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.03, 0.2);
  return t;
}

const f = (x, y) => [x - 32, 32 - y];
function roundRect(x, y, w, h, r) {
  const s = new THREE.Shape();
  const [ax, ay] = f(x, y + h);
  s.moveTo(ax + r, ay);
  s.lineTo(ax + w - r, ay);
  s.absarc(ax + w - r, ay + r, r, -Math.PI / 2, 0);
  s.lineTo(ax + w, ay + h - r);
  s.absarc(ax + w - r, ay + h - r, r, 0, Math.PI / 2);
  s.lineTo(ax + r, ay + h);
  s.absarc(ax + r, ay + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(ax, ay + r);
  s.absarc(ax + r, ay + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
function vesica(top, bottom, bulge, target) {
  const s = target ?? new THREE.Shape();
  const mid = (top + bottom) / 2;
  const span = (bottom - top) * 0.3;
  s.moveTo(...f(32, top));
  s.bezierCurveTo(...f(32 + bulge, mid - span), ...f(32 + bulge, mid + span), ...f(32, bottom));
  s.bezierCurveTo(...f(32 - bulge, mid + span), ...f(32 - bulge, mid - span), ...f(32, top));
  return s;
}

const steel = new THREE.MeshPhysicalMaterial({ color: 0x6b7885, metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2, roughnessMap: brushed() });
const gold = new THREE.MeshPhysicalMaterial({ color: 0xffa04a, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x000000, emissiveIntensity: 0 });
const blade = new THREE.MeshPhysicalMaterial({ color: 0xd9e2ea, metalness: 1, roughness: 0.08, clearcoat: 1 });
const irisMat = new THREE.MeshStandardMaterial({ map: irisTexture(), emissiveMap: irisTexture(), emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.4 });

const bevel = { bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.6, bevelSegments: 10, curveSegments: 96 };
const group = new THREE.Group();
function add(shapes, depth, mat, z, b = bevel) {
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, ...b });
  const m = new THREE.Mesh(geo, mat);
  m.position.z = z;
  group.add(m);
  return m;
}

// Tripundra: three steel bars, broken where the eye opens.
const bars = [19.5, 29.6, 39.7].map((y) => roundRect(4, y, 56, 4.6, 2.3));
add(bars, 4, steel, 0);

// The eye: gold frame, recessed glowing iris that hides the bars behind it.
const eye = vesica(6.5, 57.5, 14.5);
const hole = new THREE.Path();
vesica(10.8, 53.2, 10.6, hole);
eye.holes.push(hole);
add(eye, 7, gold, 0);

const irisShape = vesica(10.4, 53.6, 10.9);
const irisGeo = new THREE.ShapeGeometry(irisShape, 96);
irisGeo.computeBoundingBox();
const bb = irisGeo.boundingBox;
const uv = irisGeo.attributes.uv;
for (let i = 0; i < uv.count; i++) {
  const x = irisGeo.attributes.position.getX(i), y = irisGeo.attributes.position.getY(i);
  uv.setXY(i, (x - bb.min.x) / (bb.max.x - bb.min.x) * 0.62 + 0.19, (y - bb.min.y) / (bb.max.y - bb.min.y));
}
const iris = new THREE.Mesh(irisGeo, irisMat);
iris.position.z = 5.2;
group.add(iris);

// Pupil: a play triangle in polished gold, floating in the iris.
const pupil = new THREE.Shape();
pupil.moveTo(...f(28.6, 24.6)); pupil.lineTo(...f(40.6, 32)); pupil.lineTo(...f(28.6, 39.4)); pupil.lineTo(...f(28.6, 24.6));
add(pupil, 2.2, gold, 5.6, { ...bevel, bevelThickness: 0.6, bevelSize: 0.5 });

// Kalki's sword: a slim blade rising from the top of the eye.
const sw = new THREE.Shape();
sw.moveTo(...f(32, -6)); sw.lineTo(...f(33.4, 1)); sw.lineTo(...f(32, 7.5)); sw.lineTo(...f(30.6, 1)); sw.lineTo(...f(32, -6));
add(sw, 1.6, blade, 2.4, { ...bevel, bevelThickness: 0.7, bevelSize: 0.5 });

scene.add(group);
group.rotation.set(-0.1, 0.2, 0);
const box = new THREE.Box3().setFromObject(group);
group.position.sub(box.getCenter(new THREE.Vector3()));

const camera = new THREE.PerspectiveCamera(28, 1, 1, 1000);
camera.position.set(0, 0, 175);

const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(-70, 90, 120);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffe2c8, 0.6);
fill.position.set(60, 40, 140);
scene.add(fill);
const rim = new THREE.DirectionalLight(0x9fc4ff, 1.8);
rim.position.set(90, -30, -60);
scene.add(rim);

renderer.render(scene, camera);
window.__done = true;
</script></body></html>`;

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
for (const [transparent, out] of [
  [false, ".github/assets/logo-3d.png"],
  [true, "public/logo-mark.png"],
]) {
  const p = await browser.newPage({ viewport: { width: 2048, height: 2048 } });
  p.on("pageerror", (e) => console.error(e));
  await p.setContent(page(transparent));
  await p.waitForFunction(() => window.__done === true, null, {
    timeout: 120000,
  });
  await p.screenshot({ path: out, omitBackground: transparent });
  await p.close();
}
copyFileSync(".github/assets/logo-3d.png", "public/logo-3d.png");
await browser.close();
console.log("rendered");
