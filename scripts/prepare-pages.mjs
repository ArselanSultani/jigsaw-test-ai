import { copyFile, mkdir } from "node:fs/promises";

// GitHub Pages serves directory indexes for clean routes such as /jigsaw/puzzle.
await mkdir("dist/puzzle", { recursive: true });
await copyFile("dist/puzzle.html", "dist/puzzle/index.html");
