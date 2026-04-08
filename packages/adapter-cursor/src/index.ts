import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DnaAdapter } from "../../types/src/index";

export const cursorAdapter: DnaAdapter = {
  name: "cursor",
  version: "1.0.0",
  fileName: ".cursorrules",
  transform: ({ state }) => `cursor_context:
  active_project: "${state.project}"
  stack: "${state.stack}"
  code_rules:
    - "${state.neverRule}"
    - "${state.alwaysRule}"
  policy:
    secret_policy: "${state.secretPolicy}"`,
  inject: async (output) => {
    const targetPath = resolve(process.cwd(), ".cursorrules");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, output, "utf8");
  }
};
