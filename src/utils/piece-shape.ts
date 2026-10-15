type Edge = -1 | 0 | 1;

export type PieceShape = {
  path: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export function createPieceShape(row: number, col: number, size: number, unit: number, seed: number): PieceShape {
  const direction = (r: number, c: number): Edge => ((r * 7 + c * 11 + seed) % 3 === 0 ? 1 : -1);
  // Each shared boundary is generated once in board coordinates, then reversed for its neighbor.
  const top: Edge = row === 0 ? 0 : direction(row - 1, col) === 1 ? -1 : 1;
  const right: Edge = col === size - 1 ? 0 : direction(row, col);
  const bottom: Edge = row === size - 1 ? 0 : direction(row, col);
  const left: Edge = col === 0 ? 0 : direction(row, col - 1) === 1 ? -1 : 1;
  const padding = (edge: Edge) => (edge === 1 ? unit * 0.28 + 1 : 1);
  const insetLeft = padding(left);
  const insetTop = padding(top);
  const insetRight = padding(right);
  const insetBottom = padding(bottom);

  const point = (x: number, y: number) => `${insetLeft + x * unit} ${insetTop + y * unit}`;
  const commands = [`M ${point(0, 0)}`];
  const edge = (x: number, y: number, dx: number, dy: number, tab: Edge) => {
    const at = (along: number, out = 0) => point(x + dx * along + dy * out * tab, y + dy * along - dx * out * tab);
    if (tab !== 0) {
      commands.push(
        `L ${at(0.35)}`,
        `C ${at(0.45)} ${at(0.44, 0.08)} ${at(0.4, 0.12)}`,
        `C ${at(0.3, 0.28)} ${at(0.7, 0.28)} ${at(0.6, 0.12)}`,
        `C ${at(0.56, 0.08)} ${at(0.55)} ${at(0.65)}`,
      );
    }
    commands.push(`L ${at(1)}`);
  };

  edge(0, 0, 1, 0, top);
  edge(1, 0, 0, 1, right);
  edge(1, 1, -1, 0, bottom);
  edge(0, 1, 0, -1, left);
  commands.push("Z");

  return {
    path: commands.join(" "),
    left: insetLeft,
    top: insetTop,
    right: insetRight,
    bottom: insetBottom,
    width: unit + insetLeft + insetRight,
    height: unit + insetTop + insetBottom,
  };
}
