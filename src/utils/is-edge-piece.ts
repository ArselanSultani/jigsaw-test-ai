export function isEdgePiece(index: number, size: number) {
  const row = Math.floor(index / size);
  const col = index % size;
  return row === 0 || row === size - 1 || col === 0 || col === size - 1;
}
