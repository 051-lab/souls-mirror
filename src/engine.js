// Shared, game-agnostic numeric helpers and face-geometry measurement.
// Each game module builds its own slider inference on top of these.

export function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

export function inRange(value, min, max) {
  return value >= min && value <= max;
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

// Turn a raw landmark ratio into a 0-255 integer slider value.
export function range255(value, inMin, inMax, outMin, outMax) {
  return Math.round(clamp255(mapRange(value, inMin, inMax, outMin, outMax)));
}

// Measure the same face geometry for every supported game so that slider
// mappings stay consistent across the Soulsborne family.
export function computeMetrics(points, blendshapes = []) {
  const p = (index) => points[index];
  const dist = (a, b) => Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y);
  const y = (index) => p(index).y;
  const x = (index) => p(index).x;

  const faceHeight = dist(10, 152);
  const faceWidth = dist(234, 454);
  const eyeSpacing = dist(133, 362) / faceWidth;
  const leftEyeSize = dist(159, 145) / faceHeight;
  const rightEyeSize = dist(386, 374) / faceHeight;
  const eyeSize = (leftEyeSize + rightEyeSize) / 2;
  const eyeSlant = ((y(263) - y(362)) + (y(133) - y(33))) / 2 / faceHeight;
  const noseWidthRatio = dist(49, 279) / faceWidth;
  const noseLengthRatio = dist(168, 2) / faceHeight;
  const noseTipHeight = (y(2) - y(168)) / faceHeight;
  const mouthWidthRatio = dist(61, 291) / faceWidth;
  const lipThickness = dist(13, 14) / faceHeight;
  const mouthPosition = (y(13) - y(10)) / faceHeight;
  const chinHeight = dist(17, 152) / faceHeight;
  const jawWidthRatio = dist(172, 397) / faceWidth;
  const cheekWidthRatio = dist(147, 376) / faceWidth;
  const browHeight = ((y(70) + y(300)) / 2 - (y(159) + y(386)) / 2) / faceHeight;
  const faceRatio = faceHeight / faceWidth;
  const noseJog = x(2) - (x(168) + x(152)) / 2;
  const smile = blendshapes.find((shape) => shape.categoryName === "mouthSmileLeft")?.score || 0;
  const frown = blendshapes.find((shape) => shape.categoryName === "mouthFrownLeft")?.score || 0;

  return {
    faceRatio,
    eyeSpacing,
    eyeSize,
    eyeSlant,
    noseWidthRatio,
    noseLengthRatio,
    noseTipHeight,
    mouthWidthRatio,
    lipThickness,
    mouthPosition,
    chinHeight,
    jawWidthRatio,
    cheekWidthRatio,
    browHeight,
    noseJog,
    smile,
    frown,
  };
}

export function calculateConfidence(m) {
  const checks = [
    inRange(m.faceRatio, 1.05, 1.75),
    inRange(m.eyeSpacing, 0.16, 0.4),
    inRange(m.noseWidthRatio, 0.18, 0.46),
    inRange(m.mouthWidthRatio, 0.25, 0.6),
    inRange(m.lipThickness, 0.01, 0.08),
  ];
  return 0.42 + checks.filter(Boolean).length * 0.1;
}

export function getConfidenceMessage(confidence) {
  if (confidence >= 0.8) return "Good source image. These values should give a strong starting point.";
  if (confidence >= 0.6) return "Usable estimate. Expect manual tuning around eyes, skin, hair, and depth sliders.";
  if (confidence > 0) return "Low confidence. Use a cleaner front-facing image for better slider guesses.";
  return "Waiting for a face image.";
}

// Apply the shared Souls-family geometry->slider mapping. Only rows present in
// `values` are written, so a game that omits a slider simply ignores that line.
// Manual placeholders are left untouched (they stay at their default).
export function applySharedInference(values, notes, m) {
  const set = (key, raw, note = "inferred") => {
    if (!(key in values)) return;
    values[key] = Math.round(clamp255(raw));
    notes[key] = note;
  };

  set("Head", mapRange(m.faceRatio, 1.18, 1.55, 88, 202));
  set("Skin Tone", 128, "manual");
  set("Skin Color Layer 1", 128, "manual");
  set("Skin Color Layer 2", 128, "manual");
  set("Skin Color Layer 3", 178, "manual");
  set("Nose Bridge Color", 128, "manual");
  set("Cheek Color", 128, "manual");
  set("Laugh Lines", mapRange(m.frown + m.smile, 0, 0.7, 96, 172), "expression-sensitive");
  set("Nasolabial Fold", mapRange(m.frown + m.smile, 0, 0.7, 96, 172), "expression-sensitive");
  set("Apparent Age", mapRange(m.frown, 0, 0.45, 110, 176), "weak inference");
  set("Facial Aesthetic", mapRange(Math.abs(m.faceRatio - 1.35), 0, 0.25, 150, 88));
  set("Form Emphasis", mapRange(m.cheekWidthRatio, 0.7, 1.0, 92, 180));
  set("Nose Size", mapRange(m.noseWidthRatio, 0.23, 0.38, 72, 206));
  set("Nose/Forehead Ratio", mapRange(m.noseLengthRatio, 0.18, 0.33, 76, 204));
  set("Vertical Facial Spacing", mapRange(m.mouthPosition, 0.61, 0.76, 72, 206));
  set("Facial Feature Slant", mapRange(m.eyeSlant, -0.035, 0.035, 84, 190));
  set("Horizontal Facial Spacing", mapRange(m.eyeSpacing, 0.2, 0.34, 78, 202));
  set("Forehead Depth", mapRange(m.faceRatio, 1.18, 1.55, 95, 184));
  set("Forehead Protrusion", mapRange(m.browHeight, -0.08, -0.025, 172, 84));
  set("Nose Bridge Height", mapRange(m.noseLengthRatio, 0.18, 0.33, 78, 214));
  set("Nose Bridge Width", mapRange(m.noseWidthRatio, 0.23, 0.38, 82, 198));
  set("Brow Ridge Height", mapRange(m.browHeight, -0.08, -0.025, 192, 72));
  set("Inner Brow Ridge", mapRange(m.eyeSpacing, 0.2, 0.34, 96, 184));
  set("Outer Brow Ridge", mapRange(m.eyeSize, 0.025, 0.065, 176, 84));
  set("Eye Position", mapRange(m.mouthPosition, 0.61, 0.76, 184, 92));
  set("Eye Size", mapRange(m.eyeSize, 0.025, 0.065, 80, 205));
  set("Eye Slant", mapRange(m.eyeSlant, -0.035, 0.035, 82, 200));
  set("Eye Spacing", mapRange(m.eyeSpacing, 0.2, 0.34, 72, 214));
  set("Nose Ridge Depth", mapRange(m.noseLengthRatio, 0.18, 0.33, 92, 184));
  set("Nose Ridge Length", mapRange(m.noseLengthRatio, 0.18, 0.33, 75, 210));
  set("Nose Position", mapRange(m.noseTipHeight, 0.17, 0.34, 82, 196));
  set("Nose Tip Height", mapRange(m.noseTipHeight, 0.17, 0.34, 72, 216));
  set("Nose Height", mapRange(m.noseLengthRatio, 0.18, 0.33, 78, 212));
  set("Nose Slant", mapRange(m.noseJog, -0.04, 0.04, 78, 190));
  set("Nostril Size", mapRange(m.noseWidthRatio, 0.23, 0.38, 82, 208));
  set("Nostril Width", mapRange(m.noseWidthRatio, 0.23, 0.38, 72, 216));
  set("Nasal Size", mapRange(m.noseWidthRatio * m.noseLengthRatio, 0.045, 0.12, 78, 208));
  set("Cheekbone Height", mapRange(m.cheekWidthRatio, 0.7, 1.0, 90, 196));
  set("Cheekbone Width", mapRange(m.cheekWidthRatio, 0.7, 1.0, 72, 212));
  set("Cheek Thickness", mapRange(m.faceRatio, 1.18, 1.55, 180, 82));
  set("Lip Shape", mapRange(m.lipThickness, 0.018, 0.06, 82, 214));
  set("Mouth Expression", mapRange(m.smile - m.frown, -0.2, 0.4, 82, 205), "expression-sensitive");
  set("Lip Fullness", mapRange(m.lipThickness, 0.018, 0.06, 72, 218));
  set("Lip Size", mapRange(m.mouthWidthRatio * m.lipThickness, 0.008, 0.036, 80, 206));
  set("Lip Thickness", mapRange(m.lipThickness, 0.018, 0.06, 78, 218));
  set("Mouth Position", mapRange(m.mouthPosition, 0.61, 0.76, 78, 210));
  set("Mouth Width", mapRange(m.mouthWidthRatio, 0.32, 0.52, 76, 222));
  set("Mouth-Chin Distance", mapRange(m.chinHeight, 0.05, 0.17, 74, 214));
  set("Chin Length", mapRange(m.chinHeight, 0.05, 0.17, 74, 215));
  set("Chin Size", mapRange(m.jawWidthRatio, 0.55, 0.86, 84, 202));
  set("Chin Height", mapRange(m.chinHeight, 0.05, 0.17, 78, 210));
  set("Chin Width", mapRange(m.jawWidthRatio, 0.55, 0.86, 72, 218));
  set("Jaw Width", mapRange(m.jawWidthRatio, 0.55, 0.86, 70, 220));
  set("Jaw Contour", mapRange(m.faceRatio, 1.18, 1.55, 192, 74));
  set("Tone Around Eyes", mapRange(m.eyeSize, 0.025, 0.065, 170, 92));
  set("Eye Socket Brightness", mapRange(m.browHeight, -0.08, -0.025, 86, 172));
  set("Eyelid Brightness", mapRange(m.eyeSize, 0.025, 0.065, 160, 86));
  set("Lipstick 1", mapRange(m.lipThickness, 0.018, 0.06, 112, 154), "optional");
  set("Lipstick 2", mapRange(m.lipThickness, 0.018, 0.06, 112, 154), "optional");
}

// Build a fresh { values, notes } map for a game config. Numeric rows default
// to 128 (neutral); manual choices default to the label in game.choices.
export function buildDefaults(game) {
  const values = {};
  const notes = {};
  game.sliderGroups.forEach((group) => {
    group.sliders.forEach(([, key]) => {
      if (game.choices?.[key]) {
        values[key] = game.choices[key];
        notes[key] = "manual";
      } else {
        values[key] = 128;
        notes[key] = "neutral";
      }
    });
  });
  return { values, notes };
}

// ---- Photo color sampling (added 2026-10-25) ----
// The geometry mappings never sampled color: every RGB row stayed at
// neutral 128, which renders as mid-grey hair and pale skin in-game.
// These helpers sample real colors from the uploaded photo at
// landmark-anchored regions. They are pure functions over a plain
// { data, width, height } pixel buffer (no DOM), so they can be
// unit-tested without a browser.
//
// Landmark indices are MediaPipe Face Landmarker (468/478-point):
// 10 forehead top, 152 chin tip, 234/454 cheek sides, 70/300 brows,
// 159/386 upper eyelids, 172/397 jaw corners, 468/473 iris centers
// (478-point model only; eye-corner midpoints are the fallback).
// Skin rows are deliberately NOT sampled here: Bloodborne's Skin
// Color group has 7 values whose encoding is still undecoded, so
// guessing an RGB mapping for skin would be worse than leaving it
// manual. Tattoo/Glasses colors have no photo source either.

function medianChannel(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 128;
}

// Median RGB of pixels inside a small disc around a normalized
// landmark point. Returns null when the point is outside the image.
export function sampleDisc(image, point, radiusPx) {
  if (!point || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return null;
  const cx = Math.round(point.x * (image.width - 1));
  const cy = Math.round(point.y * (image.height - 1));
  const r = Math.max(1, Math.round(radiusPx));
  const rs = [];
  const gs = [];
  const bs = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
      const i = (y * image.width + x) * 4;
      rs.push(image.data[i]);
      gs.push(image.data[i + 1]);
      bs.push(image.data[i + 2]);
    }
  }
  if (!rs.length) return null;
  return [medianChannel(rs), medianChannel(gs), medianChannel(bs)];
}

// Exact pixel at a normalized point (or null outside the image).
// Used for the iris: the landmark IS the iris center, and a median
// over a disc would drown the one iris pixel in surrounding skin.
export function samplePoint(image, point) {
  if (!point || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return null;
  const x = Math.round(point.x * (image.width - 1));
  const y = Math.round(point.y * (image.height - 1));
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2]];
}

// Darkest pixel (by luminance) inside a small disc. Used for
// eyelashes: the lash line is thin, so a median would return skin.
export function sampleDarkest(image, point, radiusPx) {
  if (!point || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return null;
  const cx = Math.round(point.x * (image.width - 1));
  const cy = Math.round(point.y * (image.height - 1));
  const r = Math.max(1, Math.round(radiusPx));
  let best = null;
  let bestLum = Infinity;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
      const i = (y * image.width + x) * 4;
      const lum = 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
      if (lum < bestLum) {
        bestLum = lum;
        best = [image.data[i], image.data[i + 1], image.data[i + 2]];
      }
    }
  }
  return best;
}

function medianOfColors(colors) {
  const valid = colors.filter(Boolean);
  if (!valid.length) return null;
  return [
    medianChannel(valid.map((c) => c[0])),
    medianChannel(valid.map((c) => c[1])),
    medianChannel(valid.map((c) => c[2])),
  ];
}

export function samplePhotoColors(image, points) {
  const p = (i) => points[i];
  if (!points || points.length < 468) return null;
  const dist = (a, b) => Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y);
  const faceHeight = dist(10, 152) || 0.5;
  const faceWidth = dist(234, 454) || 0.4;
  const px = Math.max(image.width, image.height);
  const small = Math.max(2, px * 0.006); // iris / eyelid scale
  const medium = Math.max(3, px * 0.012); // brow / beard scale
  const at = (x, y) => ({ x, y });

  // Hair: above the forehead, center + both sides, pooled by median.
  // Needs hair visible above the forehead; a tightly cropped or bald
  // photo will sample background instead — the sliders stay editable
  // so a bad sample can always be corrected by hand.
  const hair = medianOfColors([
    sampleDisc(image, at(p(10).x, p(10).y - 0.25 * faceHeight), medium),
    sampleDisc(image, at(p(10).x - 0.35 * faceWidth, p(10).y - 0.08 * faceHeight), medium),
    sampleDisc(image, at(p(10).x + 0.35 * faceWidth, p(10).y - 0.08 * faceHeight), medium),
  ]);
  // Brow: directly on the brow landmarks.
  const brow = medianOfColors([
    sampleDisc(image, p(70), medium),
    sampleDisc(image, p(300), medium),
  ]);
  // Beard: chin tip + lower-jaw midpoints. Only meaningful when a
  // beard style is chosen in-game; otherwise the color is unused.
  const beard = medianOfColors([
    sampleDisc(image, p(152), medium),
    sampleDisc(image, at((p(172).x + p(152).x) / 2, (p(172).y + p(152).y) / 2), medium),
    sampleDisc(image, at((p(397).x + p(152).x) / 2, (p(397).y + p(152).y) / 2), medium),
  ]);
  // Eyelashes: darkest pixel near the upper-eyelid line (the lash
  // line itself is too thin for a median to capture).
  const eyelash = medianOfColors([
    sampleDarkest(image, p(159), small),
    sampleDarkest(image, p(386), small),
  ]);
  // Pupils: iris centers when the 478-point model is present,
  // otherwise eye-corner midpoints.
  const iris =
    points.length >= 478
      ? { left: p(468), right: p(473) }
      : {
          left: at((p(33).x + p(133).x) / 2, (p(33).y + p(133).y) / 2),
          right: at((p(362).x + p(263).x) / 2, (p(362).y + p(263).y) / 2),
        };
  const leftPupil = samplePoint(image, iris.left);
  const rightPupil = samplePoint(image, iris.right);
  const pupil = medianOfColors([leftPupil, rightPupil]);

  return { hair, brow, beard, eyelash, pupil, leftPupil, rightPupil };
}

// Write sampled colors into a game's slider values. Only keys the
// game actually has are written; everything else keeps its value.
// A null color (region outside the photo) leaves that row untouched.
export function applyPhotoColors(values, notes, colors) {
  if (!colors) return;
  const set = (key, rgb) => {
    if (!rgb || !(key + " Red" in values)) return;
    values[key + " Red"] = rgb[0];
    values[key + " Green"] = rgb[1];
    values[key + " Blue"] = rgb[2];
    notes[key + " Red"] = "sampled";
    notes[key + " Green"] = "sampled";
    notes[key + " Blue"] = "sampled";
  };
  set("Hair Color", colors.hair);
  set("Brow Color", colors.brow);
  set("Beard Color", colors.beard);
  set("Eyelash Color", colors.eyelash);
  set("Pupil Color", colors.pupil);
  set("Right Pupil Color", colors.rightPupil);
  set("Left Pupil Color", colors.leftPupil);
}

export function download(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}