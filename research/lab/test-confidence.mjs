// Tests for the honest photo-quality score (engine.js).
// Run: node research/lab/test-confidence.mjs
import { confidenceChecks, calculateConfidence, photoDrivenCount, getConfidenceMessage } from "../../src/engine.js";

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  if (!ok) failures++;
};

// Stock-photo shape: face ratio 1.80 fails, the other four pass
// except lip thickness below its window — 3 of 5, like the 72% case
// under the old formula, now honestly 60% photo quality.
const stock = {
  faceRatio: 1.8, eyeSpacing: 0.25, noseWidthRatio: 0.28,
  mouthWidthRatio: 0.38, lipThickness: 0.005,
};
const checks = confidenceChecks(stock);
check("stock check outcomes", checks.map((c) => c.passed), [false, true, true, true, false]);
check("stock score is 3/5, not 72%", calculateConfidence(stock), 0.6);

const perfect = {
  faceRatio: 1.4, eyeSpacing: 0.27, noseWidthRatio: 0.3,
  mouthWidthRatio: 0.42, lipThickness: 0.038,
};
check("all-pass score is 1.0", calculateConfidence(perfect), 1);
check("all-fail score is 0, not 0.42", calculateConfidence({
  faceRatio: 3, eyeSpacing: 0.01, noseWidthRatio: 0.01,
  mouthWidthRatio: 0.01, lipThickness: 0.5,
}), 0);

// Coverage: only inferred/sampled/expression notes count as photo-driven.
check("coverage counts photo-driven notes", photoDrivenCount({
  Head: "inferred", "Hair Color Red": "sampled", "Mouth Expression": "expression-sensitive",
  Chest: "neutral", Name: "manual", "Skin Tone": "manual",
}), { driven: 3, total: 6 });

// Messages stay photo-scoped; no-photo state still says waiting.
check("no-photo message", getConfidenceMessage(0, false), "Waiting for a face image.");
check("zero-pass photo message is low, not waiting", getConfidenceMessage(0, true),
  "Low photo quality. Use a cleaner front-facing image for better slider guesses.");
check("good photo message", getConfidenceMessage(0.8, true), "Good source photo — clean measurements.");

if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log("All confidence tests passed.");
