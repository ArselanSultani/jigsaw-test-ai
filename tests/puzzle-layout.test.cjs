const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

function load(filename) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  runInNewContext(outputText, {
    exports,
    require: (name) => load(path.resolve(path.dirname(filename), `${name}.ts`)),
  });
  return exports;
}
const { createPuzzleLayout } = load(path.resolve(__dirname, "../src/utils/puzzle-layout.ts"));

test("solution is centered and all loose pieces start outside it, fully in bounds", () => {
  for (const [width, height] of [[150, 150], [320, 320], [320, 480], [375, 650], [768, 900], [1280, 680], [1920, 1000]]) {
    for (const size of [6, 8, 10, 12]) {
      for (const seed of [1, 42, 999999]) {
        const { board, boardSize, pieceSize, pieces } = createPuzzleLayout({ width, height }, size, seed);
        assert.equal(board.x + boardSize / 2, width / 2);
        assert.equal(board.y + boardSize / 2, height / 2);
        const sides = new Set();
        for (const { start, target, shape, row, col } of pieces) {
          const left = start.x - shape.left;
          const top = start.y - shape.top;
          const right = left + shape.width;
          const bottom = top + shape.height;
          assert.ok(left >= 0 && top >= 0 && right <= width + 1e-7 && bottom <= height + 1e-7);
          assert.ok(right <= board.x || left >= board.x + boardSize || bottom <= board.y || top >= board.y + boardSize);
          if (bottom <= board.y) sides.add("top");
          if (left >= board.x + boardSize) sides.add("right");
          if (top >= board.y + boardSize) sides.add("bottom");
          if (right <= board.x) sides.add("left");
          assert.equal(target.x, board.x + col * pieceSize);
          assert.equal(target.y, board.y + row * pieceSize);
        }
        assert.ok(sides.size >= 2);
        if (width === height) assert.equal(sides.size, 4);
      }
    }
  }
});

test("board grows by at least 10% on roomy landscape and portrait screens", () => {
  for (const [width, height] of [[1920, 1000], [1280, 680], [375, 650], [650, 375]]) {
    for (const size of [6, 8, 10, 12]) {
      const oldPieceSize = Math.floor((Math.min(width, height) - 50) / (size + 3.12));
      const layout = createPuzzleLayout({ width, height }, size, 42);
      assert.ok(layout.pieceSize >= oldPieceSize * 1.1, `${width}x${height}, ${size}: ${layout.pieceSize} vs ${oldPieceSize}`);
    }
  }
});

test("distribution is stable for the same seed and handles an unmeasured view", () => {
  const area = { width: 1280, height: 800 };
  assert.equal(JSON.stringify(createPuzzleLayout(area, 6, 42)), JSON.stringify(createPuzzleLayout(area, 6, 42)));
  assert.notEqual(JSON.stringify(createPuzzleLayout(area, 6, 42)), JSON.stringify(createPuzzleLayout(area, 6, 43)));
  assert.equal(createPuzzleLayout({ width: 0, height: 0 }, 6, 42), null);
});
