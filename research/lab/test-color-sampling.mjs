// Synthetic test for engine.js color sampling (no browser needed).
// Run: node research/lab/test-color-sampling.mjs
import { samplePhotoColors, applyPhotoColors, sampleDisc } from "../../src/engine.js";

function makeImage(width, height, painter) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = painter(x, y);
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

function pointsFrom(map) {
  const pts = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [i, xy] of Object.entries(map)) pts[Number(i)] = { x: xy[0], y: xy[1] };
  return pts;
}

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  if (!ok) failures++;
};

// Image: brown hair band at top, dark brow band, black pupil center
// surrounded by a blue iris ring. The ring (not the center) is what
// iris sampling must return — center-pixel sampling would fail here.
const img = makeImage(100, 100, (x, y) => {
  if (y < 30) return [90, 50, 20]; // hair (hairline at landmark 10, y=30)
  if (y >= 40 && y < 44 && x >= 30 && x <= 70) return [30, 20, 10]; // brow
  const d = Math.hypot(x - 50, y - 50);
  if (d === 0) return [10, 10, 10]; // pupil
  if (d >= 1 && d <= 3) return [20, 60, 140]; // iris ring
  return [200, 170, 140]; // skin
});
const pts = pointsFrom({
  10: [0.5, 0.3], 152: [0.5, 0.9], 234: [0.2, 0.5], 454: [0.8, 0.5],
  70: [0.35, 0.42], 300: [0.65, 0.42], 159: [0.35, 0.5], 386: [0.65, 0.5],
  172: [0.3, 0.8], 397: [0.7, 0.8], 468: [0.5, 0.5], 473: [0.5, 0.5],
  33: [0.3, 0.5], 133: [0.4, 0.5], 362: [0.6, 0.5], 263: [0.7, 0.5],
});
const colors = samplePhotoColors(img, pts);
check("hair is brown band", colors.hair, [90, 50, 20]);
check("brow is dark band", colors.brow, [30, 20, 10]);
check("pupil is iris-ring blue, not pupil black", colors.pupil, [20, 60, 140]);

// Out-of-bounds point returns null; apply skips null colors.
check("oob disc is null", sampleDisc(img, { x: 1.5, y: 0.5 }, 3), null);
const values = { "Hair Color Red": 128, "Hair Color Green": 128, "Hair Color Blue": 128, "Tattoo / Mark Color Red": 128 };
const notes = {};
applyPhotoColors(values, notes, { hair: [90, 50, 20], brow: null, beard: null, eyelash: null, pupil: null, leftPupil: null, rightPupil: null });
check("hair written", [values["Hair Color Red"], values["Hair Color Green"], values["Hair Color Blue"]], [90, 50, 20]);
check("hair note sampled", notes["Hair Color Red"], "sampled");
check("absent key untouched", values["Tattoo / Mark Color Red"], 128);

// Too few landmarks -> null, apply is a no-op.
check("short points -> null", samplePhotoColors(img, pts.slice(0, 100)), null);

if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log("All color-sampling tests passed.");
