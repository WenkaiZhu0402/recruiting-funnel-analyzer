import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";

const runtimeFiles = ["src/main.jsx", "src/styles.css"];

function copyRuntimeFiles() {
  return {
    name: "copy-runtime-files",
    closeBundle() {
      for (const file of runtimeFiles) {
        const target = resolve("dist", file);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(resolve(file), target);
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: "dist",
  },
  plugins: [copyRuntimeFiles()],
});
