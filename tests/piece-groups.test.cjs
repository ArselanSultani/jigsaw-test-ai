const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

function load(relativePath) {
  const exports = {};
  const source = readFileSync(require.resolve(relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  runInNewContext(outputText, { exports });
  return exports;
}

const { moveGroup, snapGroup, isGroupVisible, resizeGroups } = load("../src/utils/piece-groups.ts");
const { createPieceShape } = load("../src/utils/piece-shape.ts");
const { DIFFICULTIES } = load("../src/constants/puzzles.ts");
const bounds = { width: 1200, height: 900 };

function setup(size = 3, unit = 100) {
  const geometry = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return {
      index, row, col,
      shape: createPieceShape(row, col, size, unit, 42),
      target: { x: 20 + col * unit, y: 20 + row * unit },
      start: { x: 700 + col * 130, y: 50 + row * 180 },
      isEdge: row === 0 || col === 0 || row === size - 1 || col === size - 1,
    };
  });
  const pieces = geometry.map((piece, i) => ({ ...piece.start, group: i, placed: false, zIndex: i + 1 }));
  const snap = (scene, index, edgesOnly = false) => snapGroup(scene, index, geometry, bounds, unit * 0.3, edgesOnly);
  const at = (scene, index, offset) => scene.map((piece, i) =>
    i === index ? { ...piece, x: geometry[i].target.x + offset.x, y: geometry[i].target.y + offset.y } : piece);
  return { geometry, pieces, snap, at };
}

test("correct horizontal neighbors join away from the board and move from either member", () => {
  const { geometry, pieces, snap, at } = setup();
  let scene = at(at(pieces, 0, { x: 400, y: 150 }), 1, { x: 411, y: 156 });
  scene = snap(scene, 1);
  assert.equal(scene[0].group, scene[1].group);
  assert.equal(scene[1].x - scene[0].x, 100);
  assert.equal(scene[1].y, scene[0].y);
  assert.ok(scene.every((piece) => !piece.placed));
  for (const index of [0, 1]) {
    const moved = moveGroup(scene, index, -30, 40, geometry, bounds);
    assert.equal(moved[0].x, scene[0].x - 30);
    assert.equal(moved[1].y, scene[1].y + 40);
    assert.equal(moved[2].x, scene[2].x);
  }
});

test("vertical neighbors join; diagonal, unrelated, and distant pieces do not", () => {
  const { pieces, snap, at } = setup();
  let scene = at(at(pieces, 0, { x: 400, y: 150 }), 3, { x: 408, y: 162 });
  scene = snap(scene, 3);
  assert.equal(scene[0].group, scene[3].group);
  for (const other of [2, 4, 8]) {
    const apart = at(at(pieces, 0, { x: 400, y: 150 }), other, { x: 400, y: 150 });
    assert.notEqual(snap(apart, other)[0].group, snap(apart, other)[other].group);
  }
  const distant = at(at(pieces, 0, { x: 400, y: 150 }), 1, { x: 431, y: 150 });
  assert.notEqual(snap(distant, 1)[0].group, snap(distant, 1)[1].group);
});

test("a connecting piece merges several existing clusters", () => {
  const { pieces, snap, at } = setup();
  let scene = pieces;
  for (const index of [0, 2, 3, 5]) scene = at(scene, index, { x: 400, y: 150 });
  scene = snap(scene, 3);
  scene = snap(scene, 5);
  scene = snap(at(scene, 1, { x: 408, y: 155 }), 1);
  for (const i of [0, 2, 3, 5]) assert.equal(scene[i].group, scene[1].group);
});

test("dropping a cluster on the picture anchors every member exactly", () => {
  const { geometry, pieces, snap, at } = setup();
  let scene = snap(at(at(pieces, 0, { x: 400, y: 150 }), 1, { x: 410, y: 155 }), 1);
  scene = moveGroup(scene, 0, -393, -145, geometry, bounds);
  scene = snap(scene, 0);
  for (const i of [0, 1]) {
    assert.equal(scene[i].placed, true);
    assert.equal(scene[i].x, geometry[i].target.x);
    assert.equal(scene[i].y, geometry[i].target.y);
    assert.equal(scene[i].zIndex, 0);
  }
  assert.equal(scene[2].placed, false);
});

test("an entire loose cluster can attach to an already placed neighbor", () => {
  const { geometry, pieces, snap, at } = setup();
  let scene = snap(at(pieces, 0, { x: 0, y: 0 }), 0);
  scene = snap(at(at(scene, 1, { x: 400, y: 150 }), 2, { x: 410, y: 150 }), 2);
  scene = moveGroup(scene, 2, -390, -140, geometry, bounds);
  scene = snap(scene, 2);
  for (const i of [0, 1, 2]) assert.equal(scene[i].placed, true);
});

test("group dragging clamps all members including protruding tabs", () => {
  const { geometry, pieces, snap, at } = setup();
  let scene = snap(at(at(pieces, 0, { x: 400, y: 150 }), 1, { x: 410, y: 150 }), 1);
  for (const delta of [-5000, 5000]) {
    const moved = moveGroup(scene, 1, delta, delta, geometry, bounds);
    for (const i of [0, 1]) {
      const { shape } = geometry[i];
      assert.ok(moved[i].x - shape.left >= -0.01);
      assert.ok(moved[i].y - shape.top >= -0.01);
      assert.ok(moved[i].x + 100 + shape.right <= bounds.width + 0.01);
      assert.ok(moved[i].y + 100 + shape.bottom <= bounds.height + 0.01);
    }
    assert.equal(moved[1].x - moved[0].x, 100);
    assert.equal(moved[1].y, moved[0].y);
  }
});

test("snapping cannot push a group out of the play area", () => {
  const { pieces, snap, at } = setup();
  const scene = at(at(pieces, 1, { x: -25, y: 150 }), 0, { x: 0, y: 150 });
  const next = snap(scene, 0);
  assert.notEqual(next[0].group, next[1].group);
});

test("edge filtering keeps connected interior pieces visible and ignores hidden clusters", () => {
  const { geometry, pieces, snap, at } = setup(4);
  const scene = at(at(pieces, 1, { x: 400, y: 150 }), 5, { x: 408, y: 155 });
  assert.equal(isGroupVisible(scene, 5, geometry, true), false);
  assert.notEqual(snap(scene, 1, true)[1].group, snap(scene, 1, true)[5].group);
  const joined = snap(scene, 5);
  assert.equal(joined[1].group, joined[5].group);
  assert.equal(isGroupVisible(joined, 5, geometry, true), true);
  assert.equal(isGroupVisible(joined, 6, geometry, true), false);
});

test("resizing preserves loose clusters, image alignment, placed pieces, and bounds", () => {
  const { geometry, pieces, snap, at } = setup();
  let scene = snap(at(at(pieces, 0, { x: 400, y: 150 }), 1, { x: 410, y: 150 }), 1);
  scene = snap(at(scene, 8, { x: 0, y: 0 }), 8);
  const resized = setup(3, 60).geometry;
  const smallBounds = { width: 390, height: 600 };
  const next = resizeGroups(scene, 100, resized, smallBounds);
  assert.equal(next[0].group, next[1].group);
  assert.equal(next[1].x - next[0].x, 60);
  assert.equal(next[1].y, next[0].y);
  assert.equal(next[8].x, resized[8].target.x);
  assert.equal(next[8].y, resized[8].target.y);
  for (const [i, piece] of next.entries()) {
    const { shape } = resized[i];
    assert.ok(piece.x - shape.left >= -0.01);
    assert.ok(piece.y - shape.top >= -0.01);
    assert.ok(piece.x + 60 + shape.right <= smallBounds.width + 0.01);
    assert.ok(piece.y + 60 + shape.bottom <= smallBounds.height + 0.01);
  }
  assert.equal(geometry.length, next.length);
});

test("all difficulties can be completed through neighbor/group snapping", () => {
  for (const { size } of DIFFICULTIES) {
    const { geometry, pieces, snap, at } = setup(size, 60);
    let scene = pieces;
    for (let i = 0; i < pieces.length; i++) {
      scene = snap(at(scene, i, { x: 400, y: 150 }), i);
    }
    assert.ok(scene.every((piece) => piece.group === scene[0].group && !piece.placed));
    scene = moveGroup(scene, 0, -395, -145, geometry, bounds);
    scene = snap(scene, 0);
    assert.ok(scene.every((piece) => piece.placed));
  }
});
