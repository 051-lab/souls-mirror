import {
  computeMetrics,
  calculateConfidence,
  confidenceChecks,
  buildDefaults,
  applySharedInference,
} from "../engine.js";

const sliderGroups = [
  {
    name: "Basic Setup",
    sliders: [
      ["Name", "Name"],
      ["Origin", "Origin"],
      ["Age", "Age"],
      ["Gender", "Gender"],
      ["Voice", "Voice"],
    ],
  },
  {
    name: "Face Presets",
    sliders: [
      ["Face Preset", "Face Preset"],
      ["Similar Face", "Similar Face"],
    ],
  },
  {
    name: "Scale Adjustment",
    sliders: [
      ["Head", "Head"],
      ["Chest", "Chest"],
      ["Abdomen", "Abdomen"],
      ["Arms", "Arms"],
      ["Legs", "Legs"],
    ],
  },
  {
    name: "Skin Color / Makeup",
    sliders: [["Base Skin Color", "Base Skin Color"]],
  },
  {
    name: "Skin Color",
    sliders: [
      ["Skin Tone", "Skin Tone"],
      ["Skin Color Layer 1", "Skin Color Layer 1"],
      ["Skin Color Layer 2", "Skin Color Layer 2"],
      ["Skin Color Layer 3", "Skin Color Layer 3"],
      ["Nose Bridge Color", "Nose Bridge Color"],
      ["Cheek Color", "Cheek Color"],
      ["Laugh Lines", "Laugh Lines"],
    ],
  },
  {
    name: "Features",
    sliders: [
      ["Apparent Age", "Apparent Age"],
      ["Facial Aesthetic", "Facial Aesthetic"],
      ["Form Emphasis", "Form Emphasis"],
    ],
  },
  {
    name: "Facial Balance",
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
    name: "Forehead / Glabella",
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
    ],
  },
  {
    name: "Nose Ridge",
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
    ],
  },
  {
    name: "Lips",
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
    name: "Chin",
    sliders: [
      ["Chin Tip Position", "Chin Tip Position"],
      ["Chin Length", "Chin Length"],
      ["Chin Protrusion", "Chin Protrusion"],
      ["Chin Depth", "Chin Depth"],
      ["Chin Size", "Chin Size"],
      ["Chin Height", "Chin Height"],
      ["Chin Width", "Chin Width"],
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
    name: "Eye Area",
    sliders: [
      ["Tone Around Eyes", "Tone Around Eyes"],
      ["Eye Socket Brightness", "Eye Socket Brightness"],
      ["Eyelid Brightness", "Eyelid Brightness"],
      ["Eyelid Color", "Eyelid Color"],
      ["Eyeliner", "Eyeliner"],
      ["Eye Shadow", "Eye Shadow"],
    ],
  },
  {
    name: "Lipstick",
    sliders: [
      ["Lipstick 1", "Lipstick 1"],
      ["Lipstick 2", "Lipstick 2"],
    ],
  },
  {
    name: "Hair / Facial Hair",
    sliders: [
      ["Hair/Brow/Beard Color", "Hair/Brow/Beard Color"],
      ["Hair", "Hair"],
      ["Hair Color Red", "Hair Color Red"],
      ["Hair Color Green", "Hair Color Green"],
      ["Hair Color Blue", "Hair Color Blue"],
      ["Brow", "Brow"],
      ["Brow Color Red", "Brow Color Red"],
      ["Brow Color Green", "Brow Color Green"],
      ["Brow Color Blue", "Brow Color Blue"],
      ["Beard", "Beard"],
      ["Beard Color Red", "Beard Color Red"],
      ["Beard Color Green", "Beard Color Green"],
      ["Beard Color Blue", "Beard Color Blue"],
      ["Eyelashes", "Eyelashes"],
      ["Eyelash Color Red", "Eyelash Color Red"],
      ["Eyelash Color Green", "Eyelash Color Green"],
      ["Eyelash Color Blue", "Eyelash Color Blue"],
    ],
  },
  {
    name: "Pupils",
    sliders: [
      ["Size of Pupils", "Size of Pupils"],
      ["Pupil Color Red", "Pupil Color Red"],
      ["Pupil Color Green", "Pupil Color Green"],
      ["Pupil Color Blue", "Pupil Color Blue"],
      ["Right Pupil Size", "Right Pupil Size"],
      ["Right Pupil Color Red", "Right Pupil Color Red"],
      ["Right Pupil Color Green", "Right Pupil Color Green"],
      ["Right Pupil Color Blue", "Right Pupil Color Blue"],
      ["Left Pupil Size", "Left Pupil Size"],
      ["Left Pupil Color Red", "Left Pupil Color Red"],
      ["Left Pupil Color Green", "Left Pupil Color Green"],
      ["Left Pupil Color Blue", "Left Pupil Color Blue"],
    ],
  },
  {
    name: "Tattoo / Mark / Glasses",
    sliders: [
      ["Tattoo / Mark", "Tattoo / Mark"],
      ["Tattoo / Mark Color Red", "Tattoo / Mark Color Red"],
      ["Tattoo / Mark Color Green", "Tattoo / Mark Color Green"],
      ["Tattoo / Mark Color Blue", "Tattoo / Mark Color Blue"],
      ["Glasses", "Glasses"],
      ["Glasses Color Red", "Glasses Color Red"],
      ["Glasses Color Green", "Glasses Color Green"],
      ["Glasses Color Blue", "Glasses Color Blue"],
    ],
  },
  {
    name: "Tweak Tattoo / Mark",
    sliders: [
      ["Position Vertical", "Tattoo Position Vertical"],
      ["Position Horizontal", "Tattoo Position Horizontal"],
      ["Angle", "Tattoo Angle"],
      ["Expansion", "Tattoo Expansion"],
    ],
  },
];

// Keys rendered as labelled menu choices instead of 0-255 rows.
const choices = {
  Name: "Manual",
  Origin: "Manual",
  Age: "Young",
  Gender: "Manual",
  Voice: "Manual",
  "Face Preset": "Manual",
  "Similar Face": "Manual",
  "Base Skin Color": "Manual",
  "Hair/Brow/Beard Color": "Manual",
  Hair: "Manual",
  Brow: "Manual",
  Beard: "Manual",
  Eyelashes: "Manual",
  "Size of Pupils": "Medium",
  "Right Pupil Size": "Same",
  "Left Pupil Size": "Same",
  "Tattoo / Mark": "None",
  Glasses: "None",
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
  id: "bloodborne",
  name: "Bloodborne",
  platform: "PS4",
  tagline: "Upload a face and get a 0-255 slider sheet for recreating it in Bloodborne.",
  accent: "#8d2f26",
  sliderGroups,
  choices,
  infer,
  sample,
};

export default config;