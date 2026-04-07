import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "./apps/demo",
  plugins: [react()],
  resolve: {
    alias: {
      "@agent-dna/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["../../packages/core/src/**/*.test.ts"]
  }
});
