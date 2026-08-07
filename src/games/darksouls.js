import {
  computeMetrics,
  calculateConfidence,
  buildDefaults,
  applySharedInference,
} from "../engine.js";
import { classicFacialGroups } from "./soulsGroups.js";

const sliderGroups = [
  {
    name: "Basic Setup",
    sliders: [
      ["Character Name", "Name"],
      ["Gender", "Gender"],
      ["Age", "Age"],
    ],
  },
  ...classicFacialGroups.map(({ name, sliders }) => ({
    name,
    sliders: sliders.map(([label, key]) => [label, key]),
  })),
];

// Dark Souls 1 renders gender/age as toggles and the optional look fields as
// presets rather than numeric rows.
const choices = {
  Name: "Manual",
  Gender: "Male",
  Age: "Young",
  "Eye Color": "Manual",
  "Sclera Brightness": "Manual",
  Hairstyle: "Manual",
  "Brow Style": "Manual",
  Beard: "None",
};

function infer(points, blendshapes) {
  const m = computeMetrics(points, blendshapes);
  const { values, notes } = buildDefaults(config);
  applySharedInference(values, notes, m);
  const confidence = calculateConfidence(m);
  return { values, notes, metrics: m, confidence };
}

function sample() {
  const { values, notes } = buildDefaults(config);
  values["Nose Size"] = 126;
  values["Eye Position"] = 158;
  values["Mouth Width"] = 154;
  values["Jaw Width"] = 142;
  Object.keys(values).forEach((key) => (notes[key] = "calibration"));
  const metrics = {
    faceRatio: 1.36,
    eyeSpacing: 0.27,
    eyeSize: 0.045,
    noseWidthRatio: 0.3,
    noseLengthRatio: 0.25,
    mouthWidthRatio: 0.42,
    lipThickness: 0.038,
    mouthPosition: 0.68,
    chinHeight: 0.1,
    jawWidthRatio: 0.69,
  };
  return { values, notes, metrics, confidence: 0.6 };
}

const config = {
  id: "darksouls",
  name: "Dark Souls",
  platform: "PS3 / 360 / PC",
  tagline:
    "Estimate a classic Dark Souls character sheet from a face photo. Applies to the PC, PS3, Xbox 360 and Remastered versions.",
  accent: "#7a4b3f",
  menuNote:
    "Dark Souls shares the Demon's Souls creation engine and tab order (General, Skin, Forehead, Brow, Eyes, Nose, Nostrils, Cheeks, Mouth, Jaw, Hair, Facial Hair). Values transfer directly across the original and Remaster.",
  sliderGroups,
  choices,
  infer,
  sample,
};

export default config;