import {
  computeMetrics,
  calculateConfidence,
  confidenceChecks,
  buildDefaults,
  applySharedInference,
} from "../engine.js";
import { classicFacialGroups } from "./soulsGroups.js";

const sliderGroups = [
  {
    name: "Basic Setup",
    sliders: [
      ["Name", "Name"],
      ["Origin", "Origin"],
      ["Gender", "Gender"],
      ["Age", "Age"],
      ["Class", "Class"],
    ],
  },
  ...classicFacialGroups.map(({ name, sliders }) => ({
    name,
    sliders: sliders.map(([label, key]) => [label, key]),
  })),
];

// Keys rendered as labelled menu choices instead of 0-255 rows.
const choices = {
  Name: "Manual",
  Origin: "West",
  Gender: "Male",
  Age: "Young",
  Class: "Soldier",
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
  return { values, notes, metrics: m, confidence, checks: confidenceChecks(m) };
}

function sample() {
  const { values, notes } = buildDefaults(config);
  values["Nose Size"] = 126;
  values["Eye Position"] = 158;
  values["Lip Shape"] = 168;
  values["Mouth Width"] = 154;
  values["Jaw Width"] = 142;
  values["Chin Height"] = 118;
  Object.keys(values).forEach((key) => (notes[key] = "calibration"));
  const metrics = {
    faceRatio: 1.36,
    eyeSpacing: 0.27,
    eyeSize: 0.045,
    eyeSlant: 0.004,
    noseWidthRatio: 0.3,
    noseLengthRatio: 0.25,
    noseTipHeight: 0.24,
    mouthWidthRatio: 0.42,
    lipThickness: 0.038,
    mouthPosition: 0.68,
    chinHeight: 0.1,
    jawWidthRatio: 0.69,
    cheekWidthRatio: 0.83,
    browHeight: -0.05,
    noseJog: 0,
    smile: 0.05,
    frown: 0.02,
  };
  return { values, notes, metrics, confidence: 0.62 };
}

const config = {
  id: "demonssouls",
  name: "Demon's Souls",
  platform: "PS3",
  tagline:
    "Estimate the classic Demon's Souls (PS3) character sheet from a face photo — then confirm the optional menu names against your copy.",
  accent: "#5a6b8c",
  menuNote:
    "Menu structure follows the original PS3 build (tab order: General, Skin, Forehead, Brow, Eyes, Nose, Nostrils, Cheeks, Mouth, Jaw, Hair, Facial Hair) as documented in community guides and the shared Souls-engine FaceParam table. Values transfer directly whether you're on PS3 or the remake.",
  sliderGroups,
  choices,
  infer,
  sample,
};

export default config;