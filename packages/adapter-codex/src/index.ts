import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildAgentsPreview } from "../../core/src/generators";
import type { DnaAdapter } from "../../types/src/index";

export const codexAdapter: DnaAdapter = {
  name: "codex",
  version: "1.0.0",
  fileName: "AGENTS.md",
  transform: ({ state }) => buildAgentsPreview(state),
  inject: async (output) => {
    const targetPath = resolve(process.cwd(), "AGENTS.md");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, output, "utf8");
  }
};
