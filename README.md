# Souls Mirror

Souls Mirror is a browser-based character-creation assistant for the **Soulsborne** series
(**Demon's Souls**, **Dark Souls 1–3**, **Bloodborne**, **Elden Ring**). Upload a clear face
image and it estimates a practical 0-255 slider sheet for recreating that face in-game.

It is re-branded from the original "Hunter's Mirror" Bloodborne tool into a multi-game engine
so every game shares the same analyzer while keeping its own menus and values.

## Supported Games

| Game            | Platform   | Status            |
| --------------- | ---------- | ----------------- |
| Bloodborne      | PS4        | Working prototype |
| Demon's Souls   | PS3        | Added — verify menu names against your copy |
| Dark Souls 1–3  | —          | Planned           |
| Elden Ring      | —          | Planned           |

## How It Works

- Client-side image upload; the source photo stays in the browser (never uploaded).
- MediaPipe Face Landmarker analyzes face proportions (eye spacing, mouth width, jaw width,
  chin height, nose length, and more).
- Each game config (`src/games/*.js`) maps those measurements to that game's 0-255 menus.
  The shared geometry mapping lives in `src/engine.js`.
- Confidence score plus measured feature ratios.
- Export the full sheet as **JSON** or **CSV** for manual entry in-game.

## Project Structure

```
src/
  engine.js            # shared metrics + Souls-family inference + helpers
  games/
    index.js            # game registry + lookup
    bloodborne.js       # Bloodborne config + inference
    demonssouls.js      # Demon's Souls config + inference
  main.js               # multi-game boot, UI, MediaPipe, export
  styles.css
```

## Run Locally

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`). The game-switcher chips at
the top change which slider sheet is calculated.

## Build

```bash
npm run build
npm run preview
```

The production build is a static site (Vite) and can be hosted anywhere — Netlify, GitHub
Pages, or Cloudflare Pages.

## Public Release Notes

- Face analysis runs fully in the browser; no photos leave the device.
- MediaPipe (Tasks Vision) is loaded from CDN. On machines that reject the GPU WASM delegate
  the tool automatically falls back to CPU.
- Fan project, unofficial. Menu systems belong to FromSoftware / Sony. Not a save editor and
  does not attempt exact in-game mesh reconstruction.

## Roadmap

1. Build a calibration dataset from known slider sheets + in-game screenshots; tune mappings.
2. Add source-photo color sampling for skin, hair, brow, beard, lips, and pupils.
3. Editable review mode before export and visual source-vs-result comparison.
4. Add Demon's Souls (PS5 remake), Dark Souls 1–3, and Elden Ring game modules.
5. Shareable community "Souls sliders" export layout.

## Research Basis

Slider taxonomy is based on public character-creation documentation:

- https://www.bloodborne-wiki.com/p/sliders.html
- https://bloodborne-archive.fandom.com/wiki/Face_Details
- https://demonssouls.wiki.fextralife.com/Character+Creation
- http://soulsmodding.wikidot.com/param:faceparam
- https://gamefaqs.gamespot.com/boards/954345-demons-souls/57710346 (PS3 character-creation thread)