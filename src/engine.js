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