export type PuzzleImage = {
  id: string;
  title: string;
  source: number | string;
};

export const PUZZLE_IMAGES: PuzzleImage[] = [
  { id: "casey-horner", title: "Starry valley", source: require("../../assets/images/puzzle/casey-horner-__mDpiRWwek-unsplash.jpg") },
  { id: "dario-jud", title: "Mountain sunset", source: require("../../assets/images/puzzle/dario-jud-tFnYipSckE0-unsplash.jpg") },
  { id: "europeana", title: "Meadow painting", source: require("../../assets/images/puzzle/europeana-E73xETMdlTE-unsplash.jpg") },
  { id: "raul-taciu", title: "Cliffside monastery", source: require("../../assets/images/puzzle/raul-taciu-Nc_0UwdZG-o-unsplash.jpg") },
  { id: "robert-lukeman", title: "Mountain waterfall", source: require("../../assets/images/puzzle/robert-lukeman-PH0HYjsf2n8-unsplash.jpg") },
  { id: "roberto-shumski", title: "Lighthouse", source: require("../../assets/images/puzzle/roberto-shumski-SBTYaMy4Pm4-unsplash.jpg") },
  { id: "stuart-costello", title: "Mountain lake", source: require("../../assets/images/puzzle/stuart-costello-IwmQRMNWFyg-unsplash.jpg") },
];

const legacyImages: PuzzleImage[] = [
  { id: "1015", title: "River valley", source: "https://picsum.photos/id/1015/800/800" },
  { id: "1025", title: "Pug", source: "https://picsum.photos/id/1025/800/800" },
  { id: "1039", title: "Waterfall", source: "https://picsum.photos/id/1039/800/800" },
  { id: "1043", title: "Forest", source: "https://picsum.photos/id/1043/800/800" },
  { id: "1069", title: "Jellyfish", source: "https://picsum.photos/id/1069/800/800" },
  { id: "1074", title: "Lioness", source: "https://picsum.photos/id/1074/800/800" },
];

export const ALL_PUZZLE_IMAGES = [...PUZZLE_IMAGES, ...legacyImages];

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
