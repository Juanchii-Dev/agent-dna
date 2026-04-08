import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "./apps/demo",
  plugins: [react()],
  resolve: {
    alias: {
      "@tuwebai/core/browser": fileURLToPath(new URL("./packages/core/src/browser.ts", import.meta.url)),
      "@tuwebai/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@tuwebai/types": fileURLToPath(new URL("./packages/types/src/index.ts", import.meta.url)),
      "@agent-dna/adapter-claude": fileURLToPath(new URL("./packages/adapter-claude/src/index.ts", import.meta.url)),
      "@agent-dna/adapter-codex": fileURLToPath(new URL("./packages/adapter-codex/src/index.ts", import.meta.url)),
      "@agent-dna/adapter-cursor": fileURLToPath(new URL("./packages/adapter-cursor/src/index.ts", import.meta.url)),
      "@agent-dna/adapter-stdout": fileURLToPath(new URL("./packages/adapter-stdout/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["../../packages/core/src/**/*.test.ts", "../../packages/cli/src/**/*.test.ts"]
  }
});
