# FreeVoice Roadmap

Prototype → usable, scalable, professional-grade AAC tool. This roadmap sequences work by effort/impact, building directly on the current single-file prototype (`index.html`).

## Current state (baseline)

- Single-file HTML/CSS/JS app, no build step, no backend
- Data model: `localStorage['freevoice-state-v1']` = `{ currentCategory, categories: { [name]: Tile[] } }`
- `Tile = { id, label, image?: dataURL, audio?: dataURL, emoji?: string }`
- Talker Mode (tap to speak, sentence strip), Admin Mode (PIN-gated, add/delete tiles & categories)
- Browser `SpeechSynthesis` for TTS, `MediaRecorder` for custom voice, file input w/ `capture="environment"` for photos
- Fatigue filter (3 taps/5s → cooldown), print stylesheet, JSON export/import backup
- Deployed: GitHub repo `sumit2423/freevoice-`, GitHub Pages

---

## Phase 1 — Low-lift wins (days each, build on existing code)

### 1.1 Open symbol library integration
**Why:** Camera-only means every abstract word (feelings, verbs, concepts) requires the parent to stage and photograph something. Clinical-grade symbol sets solve this for free.

**Steps:**
1. Pick a source: **ARASAAC** (~20k pictograms, CC BY-NC-SA, has a free public API at `api.arasaac.org`) or **Mulberry Symbols** (what Cboard uses, more permissive license). Confirm license terms allow your intended distribution (attribution required for ARASAAC).
2. Add a "Search symbol" tab next to the existing "Photo" input in Admin Mode's tile form.
3. Wire a search box → call the symbol API (e.g. `GET https://api.arasaac.org/api/pictograms/en/search/{word}`) → render a grid of thumbnail results → clicking one sets `pendingImage` the same way `resizeImage()` currently does for photos.
4. For offline use, cache selected symbols the same way photos are cached today (as resized dataURLs in the tile object) — don't rely on live API access at runtime in Talker Mode, only in Admin Mode when online.
5. Attribution: add a small "Symbols by ARASAAC" credit line in Admin Mode footer if using ARASAAC.

**Effort:** ~1–2 days. **Data model change:** none — reuses the existing `image` field.

### 1.2 Open Board Format (.obf/.obz) import/export
**Why:** .obf is the JSON schema used by Cboard, CoughDrop, TouchChat, and others. Supporting it means every publicly shared board (bathroom routines, feelings boards, school boards) becomes importable instantly, and your boards become portable to other tools.

**Steps:**
1. Read the [Open Board Format spec](https://www.openboardformat.org/) — core shape is `{ format, id, locale, buttons: [{id, label, image_id, vocalization}], images: [{id, data|url}], grid: {rows, columns, order} }`.
2. Write `importOBF(json)`: map `buttons[]` + `images[]` into your `Tile[]` shape (`label` → `label`, resolved `image_id` → `image` dataURL, `vocalization` fallback → spoken text).
3. Write `exportOBF(category)`: inverse mapping, so a category becomes a downloadable `.obf` file.
4. `.obz` is a zipped bundle of multiple `.obf` boards + shared images — worth supporting once single-board import works, using a small in-browser zip lib (e.g. `fflate`) for extraction.
5. Add "Import board (.obf)" / "Export board (.obf)" buttons next to the existing JSON backup buttons in Admin Mode — same file-input pattern already used for backup import.

**Effort:** ~2–3 days for single-board .obf; +1 day for .obz.

### 1.3 Fixed motor-planning grid
**Why:** LAMP's core clinical premise — buttons never change position — builds muscle memory over time. Right now tiles render in array order, so adding a new tile shifts everything after it.

**Steps:**
1. Change grid rendering from CSS auto-fill (`grid-template-columns: repeat(auto-fill, minmax(120px,1fr))`) to a fixed `rows × cols` matrix per category (e.g. 4×5), each tile carrying a `position: {row, col}` field.
2. In `renderGrid()`, render one cell per grid position; empty positions render an "Add" placeholder tile.
3. In Admin Mode, when adding a tile, let the parent pick (or auto-assign to the next open) a fixed slot rather than always appending.
4. Add "move tile" in Admin Mode (drag-and-drop or tap-source → tap-destination) so a parent can rearrange without ever disturbing muscle memory during a child's active session — rearranging should only be possible in Admin Mode, never live.

**Effort:** ~2 days. **Data model change:** add `position` to `Tile`.

### 1.4 Parts-of-speech color coding (Fitzgerald key)
**Why:** De facto clinical standard (nouns = yellow, verbs = green, descriptors = blue, social words = pink, etc.) — nearly every SLP-designed board uses it, and it helps early sentence-structure learning.

**Steps:**
1. Add a `partOfSpeech` field to `Tile` with a fixed enum (`noun | verb | descriptor | social | pronoun | question | other`).
2. Define a color map in CSS matching the standard Fitzgerald key palette.
3. In Admin Mode's tile form, add a dropdown to tag each tile's part of speech; apply the color as the tile's border/background accent in both Admin list and Talker Mode grid.
4. Backfill: on first load after this update, default all existing tiles to `other` (neutral color) so nothing breaks; parent can retag over time.

**Effort:** ~1 day.

### 1.5 Usage logging + simple reports
**Why:** SLPs and parents want to know what's actually being used — word frequency, session length, growth over time. Almost no open-source AAC tool does this well; it's a real differentiator and something therapists explicitly ask for at IEP meetings.

**Steps:**
1. On every tile tap, append `{ tileId, label, category, timestamp }` to a `localStorage['freevoice-log']` array (or move to IndexedDB once volume grows — see 2.x).
2. Add a lightweight "Reports" view in Admin Mode: total taps this week, top 10 words, taps by category, a simple day-by-day bar chart (plain `<canvas>` or SVG, no charting library needed for this scope).
3. Add CSV export ("Export usage log") for parents who want to hand raw data to a therapist.
4. Cap log growth (e.g. roll off entries older than 6 months, or cap at N rows) so `localStorage` doesn't fill up.

**Effort:** ~2 days for logging + basic report; +1 day for CSV export and chart.

### 1.6 Installable PWA + kiosk behavior
**Why:** Solves "he swiped out of the app into the browser chrome" without needing native app store distribution.

**Steps:**
1. Add `manifest.json` (name, icons, `display: "standalone"`, `orientation: "landscape"`, theme colors) and link it from `index.html`.
2. Add a service worker that caches `index.html` and all static assets (symbol library assets from 1.1 once fetched) for full offline use — this also fixes the "premium apps never lag from browser reloads" gap noted earlier.
3. Add "Add to Home Screen" prompting/instructions in a first-run banner.
4. Document OS-level kiosk lock as a companion step (not app code, but part of the how-to): Android "Screen Pinning" (Settings → Security), iOS "Guided Access" — both work against an installed PWA the same as any app.
5. Request Fullscreen API (`element.requestFullscreen()`) on entering Talker Mode as a lighter-weight in-browser fallback for devices where OS-level pinning isn't set up.

**Effort:** ~1–2 days.

---

## Phase 2 — Medium lift (real feature phases)

### 2.1 Cross-device sync
**Why:** The actual "parent edits from their phone, tablet updates automatically" capability from the original spec.

**Steps:**
1. Recommend **Firebase** (Firestore + Storage, free Spark tier) over raw Google Drive API — simpler auth (Firebase Auth supports Google Sign-In directly), realtime listeners instead of polling, and image storage built in.
2. Data model: one Firestore document per child/profile, `categories` as a subcollection or nested map mirroring the current local shape; tile images go to Firebase Storage (not inlined as base64) once synced, with the local dataURL used only until first sync.
3. Auth: parent signs in with Google in Admin Mode only; Talker Mode never requires sign-in (keeps the child-facing surface simple and offline-first).
4. Sync strategy: local `localStorage` remains the source of truth for offline use; a background sync writes local changes to Firestore when online, and a realtime listener pulls remote changes into local state — last-write-wins is fine at this scale (single family editing).
5. Migration: keep the existing JSON export/import as a manual fallback/backup path even after sync ships — it's the true "cloud regardless of any account" escape hatch.

**Effort:** ~1–2 weeks for a solid first version (auth, one-way then two-way sync, conflict handling, image upload).

### 2.2 Visual Scene Displays
**Why:** A well-documented early-AAC technique — a real photo (e.g. the living room) with tappable hotspots on actual objects — plays directly to a strength your son already has (recognizing real items/photos), and reuses existing photo-capture infrastructure.

**Steps:**
1. New board type alongside the tile grid: `SceneBoard = { id, backgroundImage, hotspots: [{x, y, w, h, tileRef}] }` (x/y/w/h as percentages of image dimensions, so it's resolution-independent).
2. Admin Mode: after capturing/uploading a full scene photo, let the parent tap-and-drag to draw a rectangle over an object, then attach a label/voice the same way a normal tile does.
3. Talker Mode: render the background image full-bleed, overlay invisible (or subtly outlined) tap targets at hotspot coordinates; tapping behaves identically to tapping a grid tile (speak + add to sentence strip).
4. Add a way to switch between grid boards and scene boards from the same category tab bar.

**Effort:** ~3–5 days.

### 2.3 Switch / scanning accessibility
**Why:** Many non-verbal kids have co-occurring motor challenges and can't reliably point at a touchscreen. Not needed for your son specifically, but it's what separates "works for my kid" from "usable by a meaningfully wider set of families" — relevant given the give-it-away goal.

**Steps:**
1. Add a "scanning mode" toggle in Admin Mode: when on, tiles highlight one at a time in sequence (row-column scanning: first scan rows, select a row, then scan tiles within it).
2. Bind a single input (spacebar/enter for testing; a real external switch typically registers as a keyboard or gamepad event) to (a) advance the scan, and (b) select the currently highlighted tile — most external AAC switches present as USB/Bluetooth HID keyboards or gamepads by default, so `keydown` and the Gamepad API cover most hardware without extra drivers.
3. Configurable scan speed (seconds per step) in Admin Mode.
4. This is purely additive — Talker Mode's default tap-to-select behavior is untouched; scanning is an alternate input layer on top of the same tile data.

**Effort:** ~1 week for a solid row-column scanning implementation.

### 2.4 Multi-profile support
**Why:** More than one child's board on one install — relevant the moment a sibling or another family uses the same install, and a prerequisite for any shared/hosted version of the tool.

**Steps:**
1. Add a `profiles` layer above the current `categories` structure: `localStorage['freevoice-profiles']` = list of `{id, name, avatar}`, with each profile's board data stored under a profile-scoped key (`freevoice-state-v1:{profileId}`).
2. Add a profile picker as the very first screen (parent selects/creates a profile before entering Talker Mode).
3. PIN protection extends naturally — Admin Mode PIN gates profile management the same way it gates tile editing today.
4. This is also the natural foundation for 2.1's sync model (one Firestore doc per profile).

**Effort:** ~2–3 days.

---

## Phase 3 — Before wide distribution

### 3.1 Voice quality upgrade
**Why:** Browser `SpeechSynthesis` is robotic and inconsistent across OS/browser. Premium tools license dedicated children's voices; this is the first place the architecture stops being free.

**Steps:**
1. Evaluate cloud neural TTS options: **Google Cloud TTS** (WaveNet/Neural2 voices, free tier ~1M chars/month), **Amazon Polly** (also has a free tier), or **ElevenLabs** (highest quality, no meaningful free tier at scale).
2. Add a TTS provider abstraction: keep `speechSynthesis` as the zero-cost default, add an optional "high-quality voice" toggle in Admin Mode that routes through a cloud API when an API key/quota is configured.
3. Cache generated audio per phrase (same tiles get spoken repeatedly) to control API costs — store the returned audio as a dataURL on the tile, same as recorded custom voice.
4. Be explicit in the UI about what requires an internet connection vs. what's always offline (the recorded-voice and default-TTS paths stay fully offline).

**Effort:** ~3–5 days for one provider integration + caching.

### 3.2 Privacy posture
**Why:** This handles a child's photos, voice, and usage data. If distributing beyond your own family, an explicit privacy stance is as much an adoption/trust factor as a technical one.

**Steps:**
1. Write a plain-language privacy statement: what's stored, where (device-only by default), what leaves the device and only when (sync/cloud TTS, both opt-in).
2. No analytics/telemetry on child usage without explicit parental opt-in — if you ever add product analytics, gate it behind a separate, off-by-default setting, and never bundle it with the usage-logging feature (1.5), which is for the parent's own eyes only.
3. If sync (2.1) ships, document Firebase's data handling and give parents a "delete all my data" action that clears both local and cloud state.
4. Consider whether any future hosted/managed version needs COPPA-aware handling (parental-consent flows) — self-hosted/local-only usage (the current model) mostly sidesteps this by keeping data off any server you control.

**Effort:** ~1–2 days of writing/config, ongoing discipline afterward.

### 3.3 Licensing + community scaffolding
**Why:** Turns this from "a repo you own" into something other parents can actually adopt and contribute to.

**Steps:**
1. Add a `LICENSE` file — MIT is simplest and most permissive for adoption; consider GPL/AGPL only if you specifically want derivative works to stay open.
2. Rewrite the README for parents first, developers second: what this is, what it costs (nothing), what it needs (a tablet + 20 minutes), before any setup/build instructions.
3. Turn on GitHub Discussions for parent-to-parent support and board-sharing — the .obf export from 1.2 is what makes "sharing a board" a literal file attachment in a discussion post rather than a support burden on you.
4. Add a `CONTRIBUTING.md` once you're ready for outside PRs, and a short `CODE_OF_CONDUCT.md` given the vulnerable population this serves.
5. Optional: i18n scaffolding (extract UI strings to a locale file) — AAC need is global, and translation is the kind of contribution non-developer community members can make directly.

**Effort:** ~2–3 days.

---

## Suggested sequencing

```
Phase 1 (in order of impact/effort ratio):
  1.1 Symbol library → 1.2 OBF import → 1.3 Fixed grid → 1.4 Color coding → 1.5 Usage logging → 1.6 PWA/kiosk

Phase 2 (pick based on what's blocking real use):
  2.1 Sync (if multi-device is the pain point)
  2.2 Visual scenes (if grid boards feel limiting for him specifically)
  2.4 Multi-profile (prerequisite if sharing with other families soon)
  2.3 Switch access (only if/when distributing beyond your family)

Phase 3 (do before any public "give this away" push):
  3.3 Licensing/community → 3.2 Privacy posture → 3.1 Voice quality (optional, cost trade-off)
```
