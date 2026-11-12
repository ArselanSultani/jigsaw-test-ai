const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const path = require("node:path");
const ts = require("typescript");

function load(filename) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  runInNewContext(outputText, {
    exports,
    require: (name) => name.endsWith(".jpg") ? 1 : load(path.resolve(path.dirname(filename), `${name}.ts`)),
  });
  return exports;
}
const { newPuzzleProgress, puzzleKey, encodePuzzleSaves, decodePuzzleSaves } =
  load(path.resolve(__dirname, "../src/utils/puzzle-progress.ts"));

function fixture() {
  const progress = newPuzzleProgress("1015", 6);
  progress.moves = 12;
  progress.showPreview = false;
  progress.showEdgesOnly = true;
  progress.snapshot = {
    pieceSize: 100,
    pieces: Array.from({ length: 36 }, (_, i) => ({
      x: 20 + i % 6 * 100,
      y: 20 + Math.floor(i / 6) * 100,
      group: i < 3 ? 0 : i,
      placed: i > 30,
      zIndex: i + 1,
    })),
  };
  return progress;
}

test("saves round-trip positions, connected groups, settings and counters", () => {
  const progress = fixture();
  const key = puzzleKey("1015", 6);
  const restored = decodePuzzleSaves(encodePuzzleSaves({ [key]: progress }));
  assert.equal(JSON.stringify(restored[key]), JSON.stringify(progress));
  assert.equal(restored[key].snapshot.pieces[1].group, 0);
  assert.equal(restored[key].snapshot.pieces[35].placed, true);
});

test("different images and difficulties have independent saves", () => {
  const saves = {};
  for (const [id, size] of [["1015", 6], ["1015", 12], ["1025", 6], ["casey-horner", 6]]) {
    saves[puzzleKey(id, size)] = newPuzzleProgress(id, size);
  }
  assert.equal(Object.keys(decodePuzzleSaves(encodePuzzleSaves(saves))).length, 4);
});

test("restart replaces only the selected puzzle", () => {
  const saves = { "1015-6": fixture(), "1025-6": newPuzzleProgress("1025", 6) };
  saves["1015-6"] = newPuzzleProgress("1015", 6);
  const restored = decodePuzzleSaves(encodePuzzleSaves(saves));
  assert.equal(restored["1015-6"].moves, 0);
  assert.equal(restored["1015-6"].snapshot, null);
  assert.equal(JSON.stringify(restored["1025-6"]), JSON.stringify(saves["1025-6"]));
});

test("invalid saved data is rejected rather than silently losing progress", () => {
  assert.throws(() => decodePuzzleSaves("not json"));
  assert.throws(() => decodePuzzleSaves('{"version":2,"puzzles":{}}'));
  for (const change of [
    p => { p.size = 99; },
    p => { p.snapshot.pieceSize = 0; },
    p => { p.snapshot.pieces.pop(); },
    p => { p.snapshot.pieces[0].x = null; },
    p => { p.snapshot.pieces[0].group = 100; },
  ]) {
    const progress = fixture();
    change(progress);
    assert.throws(() => decodePuzzleSaves(encodePuzzleSaves({ "1015-6": progress })));
  }
});
