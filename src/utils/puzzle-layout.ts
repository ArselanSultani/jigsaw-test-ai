import { isEdgePiece } from "./is-edge-piece";
import { type Bounds } from "./piece-groups";
import { createPieceShape } from "./piece-shape";

const PADDING = 12;
const GAP = 12;

function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function createPuzzleLayout({ width, height }: Bounds, size: number, seed: number) {
  // Reserve a full tab-to-tab piece width on every side of the centered image.
  const available = Math.min(width, height) - 2 * (PADDING + GAP + 1);
  const pieceSize = Math.floor(available / (size + 3.12));
  if (pieceSize < 1) return null;
  const boardSize = pieceSize * size;
  const board = { x: (width - boardSize) / 2, y: (height - boardSize) / 2 };
  const trays = [
    { x: PADDING, y: PADDING, width: width - PADDING * 2, height: board.y - GAP - PADDING },
    {
      x: board.x + boardSize + GAP,
      y: board.y,
      width: width - board.x - boardSize - GAP - PADDING,
      height: boardSize,
    },
    {
      x: PADDING,
      y: board.y + boardSize + GAP,
      width: width - PADDING * 2,
      height: height - board.y - boardSize - GAP - PADDING,
    },
    { x: PADDING, y: board.y, width: board.x - GAP - PADDING, height: boardSize },
  ];
  const random = seededRandom(seed);
  const pieces = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const shape = createPieceShape(row, col, size, pieceSize, seed);
    const tray = trays[index % trays.length];
    return {
      index,
      row,
      col,
      shape,
      isEdge: isEdgePiece(index, size),
      target: { x: board.x + col * pieceSize, y: board.y + row * pieceSize },
      start: {
        x: tray.x + shape.left + random() * Math.max(0, tray.width - shape.width),
        y: tray.y + shape.top + random() * Math.max(0, tray.height - shape.height),
      },
    };
  });
  return { board, boardSize, pieceSize, pieces };
}
