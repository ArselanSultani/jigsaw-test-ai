export type PuzzleImage = {
  id: string;
  title: string;
  uri: string;
};

const picsum = (id: number) => `https://picsum.photos/id/${id}/800/800`;

export const PUZZLE_IMAGES: PuzzleImage[] = [
  { id: "1015", title: "River valley", uri: picsum(1015) },
  { id: "1025", title: "Pug", uri: picsum(1025) },
  { id: "1039", title: "Waterfall", uri: picsum(1039) },
  { id: "1043", title: "Forest", uri: picsum(1043) },
  { id: "1069", title: "Jellyfish", uri: picsum(1069) },
  { id: "1074", title: "Lioness", uri: picsum(1074) },
];

export const DIFFICULTIES = [
  { size: 6, label: "Easy" },
  { size: 8, label: "Medium" },
  { size: 10, label: "Hard" },
  { size: 12, label: "Expert" },
] as const;

export const colors = {
  background: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
  accent: "#38BDF8",
  success: "#22C55E",
};
