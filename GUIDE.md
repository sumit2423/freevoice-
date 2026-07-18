# FreeVoice — Quick Reference

A working guide for whoever's setting up boards or troubleshooting — not the public-facing README (that's still a Phase 3 item once this is ready to give away).

## Everyday use (Talker Mode)

- Tap a tile to hear it and add it to the sentence bar at the top.
- Tap **Speak** to read the full sentence aloud.
- Tap **Clear** to reset the sentence bar.
- Tap a chip in the sentence bar to remove just that word.
- Tap the ⛶ icon to toggle fullscreen (hides browser chrome — do this before handing the device over).

## Getting into Admin/Parent Mode

- Tap the ⚙ gear icon (top right).
- Enter the PIN — default is `1234`.
- There's no in-app screen to change the PIN yet. To set a new one, open the browser's developer console on the device and run:
  ```js
  localStorage.setItem('freevoice-pin', 'yournewcode')
  ```

## Adding a tile

1. In Admin Mode, type the word in **Label**.
2. Pick a **Part of speech** — this colors the tile (nouns yellow, verbs green, etc.), matching the standard AAC color convention.
3. Choose ONE image source:
   - **Photo** — tap "Choose File" to use the camera or photo gallery. Best for personal items (his actual cup, his actual toy).
   - **Symbol search** — type a word (e.g. "happy") and tap Search, then tap a result. Good for abstract words. Requires internet; the chosen symbol is saved into the tile so it still works offline afterward.
4. Optional: tap 🎙 **Record** to add your own voice for that tile, tap ■ **Stop** when done. If skipped, the tile uses the browser's built-in text-to-speech.
5. Tap **Save tile** — it's placed automatically in the next open grid slot.

## Categories

- Use the dropdown + "New category name" field in Admin Mode to add a new board (e.g. "Kitchen," "School").
- Switch categories any time from the tab bar in Talker Mode.

## Rearranging tiles

- In Admin Mode, tap **Show rearrange grid**.
- Tap a tile, then tap where you want it to go — it swaps with whatever's there, or moves into an empty slot.
- This is deliberately manual and separate from Talker Mode: once a tile has a spot, it keeps that spot until you move it here, so tap locations become muscle memory over time.

## Usage reports

- Admin Mode → **Usage reports** shows total taps, taps in the last 7 days, and the top 10 most-used words.
- **Export usage log (.csv)** downloads the full tap history — useful to share with a speech therapist.

## Backup and sharing boards

Two different exports, for two different purposes:

- **Full backup (.json)** — everything: all categories, images, voice recordings. Use this for your own backups. Import restores the entire app state.
- **Board export (.obf)** — just the current category, in the [Open Board Format](https://www.openboardformat.org/) that other AAC apps (Cboard, CoughDrop, TouchChat) understand. Use this to share one board with someone else, or to pull in a premade board someone else built.

Both have matching **Import** buttons next to them.

## Printing a board

- Admin Mode → **Print this category** — gives a paper version of the current board. Useful as a backup if a device isn't available (pool day, dead battery).

## Installing on a tablet or phone

1. Open the app's URL in the device's browser.
2. Use the browser menu → **Add to Home Screen** (this works because the app is an installable PWA).
3. Launch it from the home screen icon from then on — it opens without the browser's address bar.

## Locking the tablet to this app (kiosk mode)

The app can't do this by itself — it's an OS-level setting:

- **Android**: Settings → Security → Screen Pinning → turn on. Then open FreeVoice, go to the recent-apps view, and pin it.
- **iOS**: Settings → Accessibility → Guided Access → turn on. Then, with FreeVoice open, triple-click the side button to start a session.

## If a change doesn't show up after an update

The app caches itself for offline use, which means an old cached copy can stick around on a device after you push a code update. As of the update-banner feature, this is mostly self-handling: when a device is online and a new version has been deployed, a small bar appears at the bottom of the screen — "A new version of FreeVoice is ready" — with a **Refresh now** button. Tap it (there's no browser address bar to use instead on a kiosk-locked device, so this is the way to pick up an update).

If the banner doesn't appear and something still looks stale:

- Close the app/tab fully and reopen it, or
- In the browser, clear site data for the app's URL, then reload.

(One-time note: any device that installed FreeVoice before the update banner shipped needs one manual force-close/reopen to pick up the code that adds the banner itself — after that, all future updates surface the banner automatically.)
