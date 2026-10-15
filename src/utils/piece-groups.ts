import { type PieceShape } from "./piece-shape";

export type Point = { x: number; y: number };
export type Bounds = { width: number; height: number };
export type PieceGeometry = {
  index: number;
  row: number;
  col: number;
  shape: PieceShape;
  target: Point;
  start: Point;
  isEdge: boolean;
};
export type PieceState = Point & { group: number; placed: boolean; zIndex: number };

export function resizeGroups(pieces: PieceState[], previousUnit: number, geometry: PieceGeometry[], bounds: Bounds) {
  const unit = geometry[0].shape.width - geometry[0].shape.left - geometry[0].shape.right;
  const scaled = pieces.map((piece, i) => ({
    ...piece,
    ...(piece.placed ? geometry[i].target : { x: (piece.x * unit) / previousUnit, y: (piece.y * unit) / previousUnit }),
  }));
  let next = scaled;
  for (const group of new Set(scaled.filter((piece) => !piece.placed).map((piece) => piece.group))) {
    const index = next.findIndex((piece) => piece.group === group);
    next = moveGroup(next, index, 0, 0, geometry, bounds);
  }
  return next;
}

export function isGroupVisible(pieces: PieceState[], index: number, geometry: PieceGeometry[], edgesOnly: boolean) {
  "worklet";
  return (
    !edgesOnly ||
    pieces[index].placed ||
    pieces.some((piece, i) => piece.group === pieces[index].group && geometry[i].isEdge)
  );
}

function areNeighbors(a: PieceGeometry, b: PieceGeometry) {
  "worklet";
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function groupFits(
  pieces: PieceState[],
  group: number,
  dx: number,
  dy: number,
  geometry: PieceGeometry[],
  bounds: Bounds,
) {
  "worklet";
  return pieces.every((piece, i) => {
    if (piece.group !== group) return true;
    const { shape } = geometry[i];
    const unit = shape.width - shape.left - shape.right;
    return (
      piece.x + dx - shape.left >= -0.01 &&
      piece.y + dy - shape.top >= -0.01 &&
      piece.x + dx + unit + shape.right <= bounds.width + 0.01 &&
      piece.y + dy + unit + shape.bottom <= bounds.height + 0.01
    );
  });
}

export function moveGroup(
  origin: PieceState[],
  index: number,
  dx: number,
  dy: number,
  geometry: PieceGeometry[],
  bounds: Bounds,
) {
  "worklet";
  const group = origin[index].group;
  let minX = -Infinity;
  let minY = -Infinity;
  let maxX = Infinity;
  let maxY = Infinity;
  origin.forEach((piece, i) => {
    if (piece.group !== group) return;
    const { shape } = geometry[i];
    const unit = shape.width - shape.left - shape.right;
    minX = Math.max(minX, shape.left - piece.x);
    minY = Math.max(minY, shape.top - piece.y);
    maxX = Math.min(maxX, bounds.width - piece.x - unit - shape.right);
    maxY = Math.min(maxY, bounds.height - piece.y - unit - shape.bottom);
  });
  const x = Math.min(Math.max(dx, minX), maxX);
  const y = Math.min(Math.max(dy, minY), maxY);
  return origin.map((piece) => (piece.group === group ? { ...piece, x: piece.x + x, y: piece.y + y } : piece));
}

export function snapGroup(
  pieces: PieceState[],
  index: number,
  geometry: PieceGeometry[],
  bounds: Bounds,
  snapDistance: number,
  edgesOnly: boolean,
) {
  "worklet";
  const group = pieces[index].group;
  const offset = {
    x: pieces[index].x - geometry[index].target.x,
    y: pieces[index].y - geometry[index].target.y,
  };
  const candidates: { dx: number; dy: number; otherGroup: number | null; placed: boolean; distance: number }[] = [];
  const consider = (dx: number, dy: number, otherGroup: number | null, placed: boolean) => {
    if (Math.abs(dx) >= snapDistance || Math.abs(dy) >= snapDistance) return;
    const distance = dx * dx + dy * dy;
    if (!groupFits(pieces, group, dx, dy, geometry, bounds)) return;
    candidates.push({ dx, dy, otherGroup, placed, distance });
  };

  consider(-offset.x, -offset.y, null, true);
  pieces.forEach((piece, i) => {
    if (piece.group !== group) return;
    pieces.forEach((other, j) => {
      if (
        other.group === group ||
        !areNeighbors(geometry[i], geometry[j]) ||
        !isGroupVisible(pieces, j, geometry, edgesOnly)
      ) return;
      consider(
        other.x - geometry[j].target.x - offset.x,
        other.y - geometry[j].target.y - offset.y,
        other.group,
        other.placed,
      );
    });
  });
  const connection = candidates.sort((a, b) => a.distance - b.distance)[0];
  if (!connection) return pieces;
  let next = pieces.map((piece) => {
    if (piece.group === group) {
      return { ...piece, x: piece.x + connection.dx, y: piece.y + connection.dy, placed: connection.placed };
    }
    return piece.group === connection.otherGroup ? { ...piece, group } : piece;
  });

  // Merge every touching, aligned group, including a bridge that joins multiple clusters.
  let joined = true;
  while (joined) {
    joined = false;
    for (let i = 0; i < next.length; i++) {
      if (next[i].group !== group) continue;
      for (let j = 0; j < next.length; j++) {
        if (
          next[j].group === group ||
          !areNeighbors(geometry[i], geometry[j]) ||
          !isGroupVisible(next, j, geometry, edgesOnly)
        ) continue;
        const dx = (next[i].x - geometry[i].target.x) - (next[j].x - geometry[j].target.x);
        const dy = (next[i].y - geometry[i].target.y) - (next[j].y - geometry[j].target.y);
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) continue;
        const otherGroup = next[j].group;
        next = next.map((piece) => (piece.group === otherGroup ? { ...piece, group } : piece));
        joined = true;
      }
    }
  }
  const anchored = next.some((piece) => piece.group === group && piece.placed);
  const zIndex = Math.max(...next.filter((piece) => piece.group === group).map((piece) => piece.zIndex));
  return next.map((piece, i) => {
    if (piece.group !== group) return piece;
    return {
      ...piece,
      ...(anchored ? geometry[i].target : {}),
      placed: anchored,
      zIndex: anchored ? 0 : zIndex,
    };
  });
}
