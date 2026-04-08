import { beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runWrappedCommand } from "./run-command";

describe("run-command", () => {
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;

  beforeEach(() => {
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
  });

  it("falla con mensaje claro si falta el script del interpreter", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}-run-missing`);
    const dnaHome = join(tempHome, ".agent-dna");
    await fs.mkdir(dnaHome, { recursive: true });
    await fs.writeFile(
      join(dnaHome, "dna.yaml"),
      'version: "1.0"\nidentity:\n  name: "Juanchi"\n  role: "Founder"\nstack:\n  primary:\n    - TypeScript\n',
      "utf8"
    );
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    await expect(runWrappedCommand({ args: ["--tool", "cursor", "--", "node", "script.js"] })).rejects.toThrow(
      "Archivo de script no encontrado:"
    );
  });
});
