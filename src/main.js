import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs";
import "./styles.css";
import { games, getGame } from "./games/index.js";
import { buildDefaults, getConfidenceMessage, download, csvCell, escapeHtml, samplePhotoColors, applyPhotoColors, photoDrivenCount } from "./engine.js";

const app = document.querySelector("#app");

let faceLandmarker;
let activeImage;
let activeObjectUrl;

const defaultResult = (game) => buildDefaults(game);

let state = {
  gameId: "bloodborne",
  status: "Drop in a clear, front-facing face image to begin.",
  isLoading: false,
  result: defaultResult(getGame("bloodborne")),
  metrics: null,
  confidence: 0,
  checks: null,
  coverage: null,
  imageName: "",
  landmarks: [],
};

render();
initLandmarker();

async function initLandmarker() {
  setState({ isLoading: true, status: "Loading local face analysis model..." });
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    );
    const options = {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
      },
      outputFaceBlendshapes: true,
      runningMode: "IMAGE",
      numFaces: 1,
    };
    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: "GPU" },
      });
    } catch (gpuError) {
      // Some hardware/drivers reject the GPU WASM module; fall back to CPU.
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: "CPU" },
      });
    }
    setState({
      isLoading: false,
      status: "Ready. Upload a face image and the tool will produce a slider sheet.",
    });
  } catch (error) {
    setState({
      isLoading: false,
      status: `Face model failed to load: ${error.message}`,
    });
  }
}

function currentGame() {
  return getGame(state.gameId);
}

function selectGame(gameId) {
  if (gameId === state.gameId) return;
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = null;
  activeImage = null;
  setState({
    gameId,
    result: defaultResult(getGame(gameId)),
    metrics: null,
    confidence: 0,
    checks: null,
    coverage: null,
    landmarks: [],
    imageName: "",
    status: faceLandmarker
      ? `Switched to ${getGame(gameId).name}. Upload a face image to begin.`
      : "Loading face analysis model...",
  });
}

function render() {
  const game = currentGame();
  app.innerHTML = `
    <main class="shell" style="--accent:${game.accent};--accent-soft:${game.accent}26">
      <section class="intro">
        <div>
          <p class="eyebrow">Soulsborne character creation tool</p>
          <h1>Souls Mirror</h1>
          <p class="lede">${escapeHtml(game.tagline)}</p>
          <nav class="game-switch" aria-label="Select game">
            ${games
              .map(
                (g) => `
                  <button
                    class="game-chip ${g.id === state.gameId ? "is-active" : ""}"
                    data-game="${g.id}"
                    type="button"
                  >${escapeHtml(g.name)} <span>${g.platform}</span></button>
                `,
              )
              .join("")}
          </nav>
        </div>
        <div class="status" aria-live="polite">
          <span class="status-dot ${state.isLoading ? "pulse" : ""}"></span>
          <span>${escapeHtml(state.status)}</span>
        </div>
      </section>

      <section class="workspace">
        <div class="panel input-panel">
          <div class="dropzone" id="dropzone">
            <input id="fileInput" type="file" accept="image/*" />
            <div class="drop-copy">
              <span class="upload-icon">+</span>
              <h2>Upload Face</h2>
              <p>Best results: front-facing, neutral expression, visible chin, no heavy shadows.</p>
            </div>
          </div>
          <div class="preview-wrap ${activeImage ? "has-image" : ""}">
            <canvas id="previewCanvas" width="900" height="900" aria-label="Face preview"></canvas>
          </div>
          <div class="actions">
            <button id="sampleBtn" type="button">Calibration preset</button>
            <button id="exportJson" type="button" ${state.result ? "" : "disabled"}>Export JSON</button>
            <button id="exportCsv" type="button" ${state.result ? "" : "disabled"}>Export CSV</button>
          </div>
        </div>

        <aside class="panel score-panel">
          <div>
            <span class="label">Photo quality</span>
            <strong>${Math.round(state.confidence * 100)}%</strong>
          </div>
          <div class="meter"><span style="width:${Math.round(state.confidence * 100)}%"></span></div>
          <p>${escapeHtml(getConfidenceMessage(state.confidence, !!state.metrics))}</p>
          ${renderChecks(state.checks)}
          ${renderCoverage(state.coverage)}
          <dl class="metrics">${renderMetrics(state.metrics)}</dl>
        </aside>
      </section>

      <section class="slider-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Recommended values</p>
            <h2>Slider Sheet − ${escapeHtml(game.name)}</h2>
          </div>
          <p>Values follow ${escapeHtml(game.name)}'s creation menus. "Neutral" rows and labelled choices are manual — tune them in-game.</p>
        </div>
        ${game.menuNote ? `<p class="menu-note">${escapeHtml(game.menuNote)}</p>` : ""}
        <div class="slider-grid">
          ${game.sliderGroups.map((group) => renderGroup(game, group)).join("")}
        </div>
      </section>

      <section class="research">
        <h2>How this works</h2>
        <p>MediaPipe face landmarks measure proportions such as eye spacing, mouth width, jaw width, chin height, and nose length. Those measurements are mapped to the Soulsbourne family's shared 0-255 slider categories. Hair, brow, beard, eyelash, and pupil colors are sampled from the photo itself (rows marked "sampled"); skin tones stay manual until their in-game encoding is decoded.</p>
        <p>This is not a save editor and does not claim exact in-game mesh reconstruction. The next quality jump is calibration: feed in screenshot pairs of real faces and generated results, then tune these mappings against actual output.</p>
        <p class="colophon">
          Fan project, unofficial. Character creation menus belong to FromSoftware / Sony. Face model runs entirely in your browser — your photo is never uploaded.
        </p>
      </section>
    </main>
  `;

  bindEvents();
  drawPreview();
}

function renderGroup(game, group) {
  return `
    <article class="slider-card">
      <h3>${escapeHtml(group.name)}</h3>
      ${group.sliders
        .map(([label, key]) => {
          const value = state.result.values[key] ?? 128;
          const note = state.result.notes[key] || "";
          if (typeof value === "string") {
            return `
              <div class="slider-row">
                <div class="slider-copy">
                  <span>${escapeHtml(label)}</span>
                  <em>${escapeHtml(note)}</em>
                </div>
                <span class="choice-tag">${escapeHtml(value)}</span>
              </div>
            `;
          }
          const scalar = typeof value === "number" ? value : 128;
          return `
            <div class="slider-row">
              <div class="slider-copy">
                <span>${escapeHtml(label)}</span>
                <em>${escapeHtml(note)}</em>
              </div>
              <div class="range-wrap">
                <input
                  class="soul-slider"
                  type="range"
                  min="0"
                  max="255"
                  step="1"
                  value="${scalar}"
                  data-key="${escapeHtml(key)}"
                  aria-label="${escapeHtml(label)}"
                />
              </div>
              <output data-out="${escapeHtml(key)}">${scalar}</output>
            </div>
          `;
        })
        .join("")}
    </article>
  `;
}

function renderChecks(checks) {
  if (!checks) return "";
  const rows = checks
    .map(
      (c) => `<div><dt>${escapeHtml(c.label)}</dt><dd>${c.passed ? "✓" : "✗"} ${c.value.toFixed(2)} <span>(${c.min}–${c.max})</span></dd></div>`,
    )
    .join("");
  return `<p class="label">Quality checks</p><dl class="metrics">${rows}</dl>`;
}

function renderCoverage(coverage) {
  if (!coverage) return "";
  const pct = coverage.total ? Math.round((coverage.driven / coverage.total) * 100) : 0;
  return `<p>Photo-driven rows: <strong>${coverage.driven} of ${coverage.total} (${pct}%)</strong> — the rest are manual or neutral.</p>
    <p>Expected likeness: not yet measurable. The mappings are uncalibrated, so no likeness percentage is shown.</p>`;
}

function renderMetrics(metrics) {
  if (!metrics) {
    return `
      <div><dt>Face width</dt><dd>-</dd></div>
      <div><dt>Eye spacing</dt><dd>-</dd></div>
      <div><dt>Nose width</dt><dd>-</dd></div>
      <div><dt>Mouth width</dt><dd>-</dd></div>
    `;
  }
  return Object.entries({
    "Face ratio": metrics.faceRatio,
    "Eye spacing": metrics.eyeSpacing,
    "Nose width": metrics.noseWidthRatio,
    "Mouth width": metrics.mouthWidthRatio,
  })
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value.toFixed(2)}</dd></div>`)
    .join("");
}

function bindEvents() {
  const input = document.querySelector("#fileInput");

  document.querySelectorAll(".game-chip").forEach((chip) => {
    chip.addEventListener("click", () => selectGame(chip.dataset.game));
  });

  input.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) loadImageFile(file);
  });

  const dropzone = document.querySelector("#dropzone");
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    const [file] = event.dataTransfer.files;
    if (file) loadImageFile(file);
  });

  document.querySelector("#sampleBtn").addEventListener("click", () => {
    const game = currentGame();
    const sample = game.sample();
    setState({
      result: { values: sample.values, notes: sample.notes },
      metrics: sample.metrics,
      confidence: sample.confidence,
      checks: null,
      coverage: null,
      landmarks: [],
      imageName: "Calibration preset",
      status: `Loaded the neutral ${game.name} preset so you can inspect the full sheet.`,
    });
  });

  document.querySelector("#exportJson").addEventListener("click", exportJson);
  document.querySelector("#exportCsv").addEventListener("click", exportCsv);

  const grid = document.querySelector(".slider-grid");
  if (grid) {
    grid.addEventListener("input", onSliderInput);
    grid.addEventListener("change", onSliderChange);
  }
}

function onSliderInput(event) {
  if (!event.target.matches(".soul-slider")) return;
  const out = event.target.closest(".slider-row").querySelector("output");
  if (out) out.textContent = event.target.value;
}

function onSliderChange(event) {
  if (!event.target.matches(".soul-slider")) return;
  const key = event.target.dataset.key;
  const value = Number(event.target.value);
  state = {
    ...state,
    result: {
      ...state.result,
      values: { ...state.result.values, [key]: value },
      notes: { ...state.result.notes, [key]: "custom" },
    },
  };
}

function exportJson() {
  const game = currentGame();
  download(`${game.id}-sliders.json`, JSON.stringify(state.result.values, null, 2));
}

function exportCsv() {
  const game = currentGame();
  const rows = [["Game", "Group", "Slider", "Value", "Note"]];
  game.sliderGroups.forEach((group) => {
    group.sliders.forEach(([label, key]) => {
      rows.push([game.name, group.name, label, state.result.values[key] ?? 128, state.result.notes[key] ?? ""]);
    });
  });
  download(`${game.id}-sliders.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"));
}

async function loadImageFile(file) {
  if (!faceLandmarker) {
    setState({ status: "Face model is still loading. Try again in a moment." });
    return;
  }
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = async () => {
    activeImage = image;
    setState({ isLoading: true, imageName: file.name, status: "Analyzing face geometry..." });
    await analyzeImage(image);
  };
  image.onerror = () => setState({ status: "That file could not be loaded as an image." });
  image.src = activeObjectUrl;
}

async function analyzeImage(image) {
  try {
    const detection = faceLandmarker.detect(image);
    const [landmarks] = detection.faceLandmarks;
    if (!landmarks) {
      setState({
        isLoading: false,
        status: "No face found. Try a brighter front-facing image.",
        confidence: 0,
        checks: null,
        coverage: null,
        landmarks: [],
      });
      return;
    }

    const game = currentGame();
    const analysis = game.infer(landmarks, detection.faceBlendshapes?.[0]?.categories || []);
    // Sample hair/brow/beard/eyelash/pupil colors from the photo itself.
    // Guarded: a color failure must never break the geometry sheet.
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colors = samplePhotoColors(pixels, landmarks);
      applyPhotoColors(analysis.values, analysis.notes, colors);
    } catch (colorError) {
      // Keep the neutral color rows; geometry result still stands.
    }
    setState({
      isLoading: false,
      result: { values: analysis.values, notes: analysis.notes },
      metrics: analysis.metrics,
      confidence: analysis.confidence,
      checks: analysis.checks || null,
      coverage: photoDrivenCount(analysis.notes),
      landmarks,
      status: `Analyzed ${state.imageName || "image"} for ${game.name}. Slider sheet updated.`,
    });
  } catch (error) {
    setState({ isLoading: false, status: `Analysis failed: ${error.message}` });
  }
}

function drawPreview() {
  const canvas = document.querySelector("#previewCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#151312";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!activeImage) {
    ctx.fillStyle = "#8b827b";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Image preview", canvas.width / 2, canvas.height / 2);
    return;
  }

  const scale = Math.min(canvas.width / activeImage.width, canvas.height / activeImage.height);
  const width = activeImage.width * scale;
  const height = activeImage.height * scale;
  const offsetX = (canvas.width - width) / 2;
  const offsetY = (canvas.height - height) / 2;
  ctx.drawImage(activeImage, offsetX, offsetY, width, height);

  if (!state.landmarks.length) return;

  ctx.fillStyle = "rgba(213, 62, 45, 0.9)";
  [10, 152, 234, 454, 33, 133, 362, 263, 49, 279, 2, 61, 291, 13, 14, 172, 397].forEach((index) => {
    const point = state.landmarks[index];
    ctx.beginPath();
    ctx.arc(offsetX + point.x * width, offsetY + point.y * height, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function setState(next) {
  state = { ...state, ...next };
  render();
}