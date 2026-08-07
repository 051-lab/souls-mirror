import {
  computeMetrics,
  calculateConfidence,
  buildDefaults,
  applySharedInference,
} from "../engine.js";

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
  {
    name: "General (Balance)",
    sliders: [
      ["Nose Size", "Nose Size"],
      ["Nose/Forehead Ratio", "Nose/Forehead Ratio"],
      ["Face Protrusion", "Face Protrusion"],
      ["Vertical Facial Spacing", "Vertical Facial Spacing"],
      ["Facial Feature Slant", "Facial Feature Slant"],
      ["Horizontal Facial Spacing", "Horizontal Facial Spacing"],
    ],
  },
  {
    name: "Skin",
    sliders: [
      ["Skin Tone", "Skin Tone"],
      ["Skin Color Layer 1", "Skin Color Layer 1"],
      ["Skin Color Layer 2", "Skin Color Layer 2"],
      ["Skin Color Layer 3", "Skin Color Layer 3"],
      ["Skin Color Layer 4", "Skin Color Layer 4"],
      ["Nose Bridge Color", "Nose Bridge Color"],
      ["Cheek Color", "Cheek Color"],
    ],
  },
  {
    name: "Forehead",
    sliders: [
      ["Forehead Depth", "Forehead Depth"],
      ["Forehead Protrusion", "Forehead Protrusion"],
      ["Nose Bridge Height", "Nose Bridge Height"],
      ["Bridge Protrusion 1", "Bridge Protrusion 1"],
      ["Bridge Protrusion 2", "Bridge Protrusion 2"],
      ["Nose Bridge Width", "Nose Bridge Width"],
    ],
  },
  {
    name: "Brow Ridge",
    sliders: [
      ["Brow Ridge Height", "Brow Ridge Height"],
      ["Inner Brow Ridge", "Inner Brow Ridge"],
      ["Outer Brow Ridge", "Outer Brow Ridge"],
    ],
  },
  {
    name: "Eyes",
    sliders: [
      ["Eye Position", "Eye Position"],
      ["Eye Size", "Eye Size"],
      ["Eye Slant", "Eye Slant"],
      ["Eye Spacing", "Eye Spacing"],
      ["Eye Color", "Eye Color"],
    ],
  },
  {
    name: "Cosmetics",
    sliders: [
      ["Sclera Brightness", "Sclera Brightness"],
      ["Tone Around Eyes", "Tone Around Eyes"],
      ["Eye Socket", "Eye Socket Brightness"],
      ["Eyelid Brightness", "Eyelid Brightness"],
      ["Eyelid Color", "Eyelid Color"],
      ["Eyeliner", "Eyeliner"],
      ["Eye Shadow", "Eye Shadow"],
    ],
  },
  {
    name: "Nose",
    sliders: [
      ["Nose Ridge Depth", "Nose Ridge Depth"],
      ["Nose Ridge Length", "Nose Ridge Length"],
      ["Nose Position", "Nose Position"],
      ["Nose Tip Height", "Nose Tip Height"],
      ["Nose Protrusion", "Nose Protrusion"],
      ["Nose Height", "Nose Height"],
      ["Nose Slant", "Nose Slant"],
    ],
  },
  {
    name: "Nostrils",
    sliders: [
      ["Nostril Slant", "Nostril Slant"],
      ["Nostril Size", "Nostril Size"],
      ["Nostril Width", "Nostril Width"],
      ["Nasal Size", "Nasal Size"],
    ],
  },
  {
    name: "Cheeks",
    sliders: [
      ["Cheekbone Height", "Cheekbone Height"],
      ["Cheekbone Depth", "Cheekbone Depth"],
      ["Cheekbone Width", "Cheekbone Width"],
      ["Cheekbone Protrusion", "Cheekbone Protrusion"],
      ["Cheek Thickness", "Cheek Thickness"],
      ["Nasolabial Fold", "Nasolabial Fold"],
    ],
  },
  {
    name: "Mouth (Lips)",
    sliders: [
      ["Lip Shape", "Lip Shape"],
      ["Mouth Expression", "Mouth Expression"],
      ["Lip Fullness", "Lip Fullness"],
      ["Lip Size", "Lip Size"],
      ["Lip Protrusion", "Lip Protrusion"],
      ["Lip Thickness", "Lip Thickness"],
    ],
  },
  {
    name: "Mouth",
    sliders: [
      ["Mouth Protrusion", "Mouth Protrusion"],
      ["Mouth Slant", "Mouth Slant"],
      ["Occlusion", "Occlusion"],
      ["Mouth Position", "Mouth Position"],
      ["Mouth Width", "Mouth Width"],
      ["Mouth-Chin Distance", "Mouth-Chin Distance"],
    ],
  },
  {
    name: "Jaw (Chin)",
    sliders: [
      ["Chin Tip Position", "Chin Tip Position"],
      ["Chin Length", "Chin Length"],
      ["Chin Protrusion", "Chin Protrusion"],
      ["Chin Depth", "Chin Depth"],
      ["Chin Size", "Chin Size"],
      ["Chin Height", "Chin Height"],
      ["Chin Width", "Chin Width"],
      ["Chin Vertical", "Chin Vertical"],
    ],
  },
  {
    name: "Jaw",
    sliders: [
      ["Jaw Protrusion", "Jaw Protrusion"],
      ["Jaw Width", "Jaw Width"],
      ["Lower Jaw", "Lower Jaw"],
      ["Jaw Contour", "Jaw Contour"],
    ],
  },
  {
    name: "Hair",
    sliders: [
      ["Hairstyle", "Hairstyle"],
      ["Hair Color Red", "Hair Color Red"],
      ["Hair Color Green", "Hair Color Green"],
      ["Hair Color Blue", "Hair Color Blue"],
    ],
  },
  {
    name: "Facial Hair",
    sliders: [
      ["Brow Style", "Brow Style"],
      ["Brow Color Red", "Brow Color Red"],
      ["Brow Color Green", "Brow Color Green"],
      ["Brow Color Blue", "Brow Color Blue"],
      ["Beard", "Beard"],
      ["Beard Color Red", "Beard Color Red"],
      ["Beard Color Green", "Beard Color Green"],
      ["Beard Color Blue", "Beard Color Blue"],
    ],
  },
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
  return { values, notes, metrics: m, confidence };
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