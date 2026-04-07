import { buildDocumentYaml } from "../../core/src/document";
import type { DnaAdapter } from "../../types/src/index";

export const stdoutAdapter: DnaAdapter = {
  name: "stdout",
  version: "1.0.0",
  transform: ({ document }) => buildDocumentYaml(document),
  inject: async () => undefined
};
