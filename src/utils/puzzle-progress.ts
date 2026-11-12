import { ALL_PUZZLE_IMAGES, DIFFICULTIES } from "../constants/puzzles";
import { type PieceState } from "./piece-groups";

export type SavedPieces = { pieces: PieceState[]; pieceSize: number };
export type PuzzleProgress = {
  imageId: string;
  size: number;
  seed: number;
  snapshot: SavedPieces | null;
  moves: number;
  showPreview: boolean;
  showEdgesOnly: boolean;
  startedAt: number;
  finishedAt: number | null;
};
export type PuzzleSaves = Record<string, PuzzleProgress>;

export const puzzleKey = (imageId: string, size: number) => `${imageId}-${size}`;

export function newPuzzleProgress(imageId: string, size: number): PuzzleProgress {
  return {
    imageId,
    size,
    seed: Math.floor(Math.random() * 1_000_000) + 1,
    snapshot: null,
    moves: 0,
    showPreview: true,
    showEdgesOnly: false,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const nonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isProgress(value: unknown): value is PuzzleProgress {
  if (!record(value) || !ALL_PUZZLE_IMAGES.some((image) => image.id === value.imageId) ||
    !DIFFICULTIES.some((level) => level.size === value.size) ||
    !nonnegative(value.seed) || !Number.isInteger(value.seed) ||
    !nonnegative(value.moves) || !Number.isInteger(value.moves) ||
    !nonnegative(value.startedAt) ||
    !(value.finishedAt === null || nonnegative(value.finishedAt)) ||
    typeof value.showPreview !== "boolean" || typeof value.showEdgesOnly !== "boolean") return false;
  if (value.snapshot === null) return true;
  if (!record(value.snapshot) || !nonnegative(value.snapshot.pieceSize) || value.snapshot.pieceSize === 0 ||
    !Array.isArray(value.snapshot.pieces) || typeof value.size !== "number" ||
    value.snapshot.pieces.length !== value.size * value.size) return false;
  const total = value.snapshot.pieces.length;
  return value.snapshot.pieces.every((piece: unknown) => record(piece) &&
    nonnegative(piece.x) && nonnegative(piece.y) && nonnegative(piece.zIndex) &&
    typeof piece.placed === "boolean" && nonnegative(piece.group) &&
    Number.isInteger(piece.group) && piece.group < total);
}

export function decodePuzzleSaves(raw: string): PuzzleSaves {
  const data: unknown = JSON.parse(raw);
  if (!record(data) || data.version !== 1 || !record(data.puzzles)) {
    throw new Error("Saved puzzle data has an unsupported format.");
  }
  const puzzles: PuzzleSaves = {};
  for (const [key, value] of Object.entries(data.puzzles)) {
    if (!isProgress(value) || key !== puzzleKey(value.imageId, value.size)) {
      throw new Error("Saved puzzle data is invalid.");
    }
    puzzles[key] = value;
  }
  return puzzles;
}

export function encodePuzzleSaves(puzzles: PuzzleSaves) {
  return JSON.stringify({ version: 1, puzzles });
}
