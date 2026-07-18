// Pure logic shared by index.html and test.html. No DOM, no localStorage, no network —
// side effects (save, download, fetch) stay in index.html so this stays trivially testable.
(function (global) {
  "use strict";

  const GRID_ROWS = 4, GRID_COLS = 5;
  const MAX_LOG = 5000;

  const POS_COLORS = {
    noun: "#f5c542", verb: "#5fd07a", descriptor: "#5fb0f0",
    social: "#f582b8", pronoun: "#b08af0", question: "#f07a5f", other: "#c8cdd8"
  };

  function posKey(pos) { return pos.row + "," + pos.col; }

  function migrateState(state) {
    Object.keys(state.categories).forEach(cat => {
      const tiles = state.categories[cat];
      const used = new Set();
      tiles.forEach(t => { if (t.position) used.add(posKey(t.position)); });
      let cursor = 0;
      tiles.forEach(t => {
        if (!t.partOfSpeech) t.partOfSpeech = "other";
        if (!t.position) {
          while (used.has(posKey({ row: Math.floor(cursor / GRID_COLS), col: cursor % GRID_COLS }))) cursor++;
          const p = { row: Math.floor(cursor / GRID_COLS), col: cursor % GRID_COLS };
          t.position = p;
          used.add(posKey(p));
          cursor++;
        }
      });
    });
    return state;
  }

  function nextEmptySlot(tiles) {
    const used = new Set((tiles || []).map(t => posKey(t.position)));
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!used.has(r + "," + c)) return { row: r, col: c };
      }
    }
    return null;
  }

  function buildOBF(tiles, catName) {
    const order = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    const buttons = [], images = [];
    (tiles || []).forEach((t, i) => {
      const btnId = "b" + i;
      const btn = { id: btnId, label: t.label, vocalization: t.label };
      if (t.image) {
        btn.image_id = "img" + i;
        images.push({ id: "img" + i, data: t.image, content_type: t.image.startsWith("data:image/png") ? "image/png" : "image/jpeg" });
      }
      buttons.push(btn);
      const r = t.position.row, c = t.position.col;
      if (order[r]) order[r][c] = btnId;
    });
    return {
      format: "open-board-0.1",
      id: "freevoice-" + Date.now(),
      locale: "en",
      name: catName,
      buttons, images,
      grid: { rows: GRID_ROWS, columns: GRID_COLS, order }
    };
  }

  function parseOBF(json) {
    const imagesById = {};
    (json.images || []).forEach(img => { imagesById[img.id] = img.data || img.url || null; });
    const catName = json.name || ("Imported " + new Date().toLocaleDateString());
    const tiles = [];
    const order = json.grid && json.grid.order;
    (json.buttons || []).forEach((btn, i) => {
      let row = Math.floor(i / GRID_COLS), col = i % GRID_COLS, found = false;
      if (order) {
        for (let r = 0; r < order.length && !found; r++) {
          for (let c = 0; c < order[r].length && !found; c++) {
            if (order[r][c] === btn.id) { row = r; col = c; found = true; }
          }
        }
      }
      if (row >= GRID_ROWS || col >= GRID_COLS) { row = Math.floor(i / GRID_COLS) % GRID_ROWS; col = i % GRID_COLS; }
      tiles.push({
        id: "t" + Date.now() + "_" + i,
        label: btn.label || btn.vocalization || "?",
        image: btn.image_id ? (imagesById[btn.image_id] || null) : null,
        audio: null,
        partOfSpeech: "other",
        position: { row, col }
      });
    });
    return { catName, tiles };
  }

  function capLog(log, maxLen) {
    maxLen = maxLen || MAX_LOG;
    return log.length > maxLen ? log.slice(log.length - maxLen) : log;
  }

  function csvFromLog(log) {
    const rows = ["tileId,label,category,timestamp"].concat(
      (log || []).map(e => `${e.tileId},"${(e.label || "").replace(/"/g, '""')}",${e.category},${new Date(e.ts).toISOString()}`)
    );
    return rows.join("\n");
  }

  function logStats(log, now) {
    now = now || Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return { totalAll: log.length, totalWeek: log.filter(e => e.ts >= weekAgo).length };
  }

  function topWords(log, n) {
    const counts = {};
    (log || []).forEach(e => { counts[e.label] = (counts[e.label] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n || 10);
  }

  global.FreeVoiceCore = {
    GRID_ROWS, GRID_COLS, MAX_LOG, POS_COLORS,
    posKey, migrateState, nextEmptySlot, buildOBF, parseOBF, capLog, csvFromLog, logStats, topWords
  };
})(window);
