import { beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "./agent-dna-cli";

const fixturePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "agent-dna.yaml");

describe("agent-dna-cli", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  beforeEach(() => {
    logSpy.mockClear();
    errorSpy.mockClear();
  });

  it("soporta campo anidado en show", async () => {
    await runCli(["show", fixturePath, "--field", "identity.name", "--format", "json"]);
    expect(logSpy).toHaveBeenCalledWith('"Juanchi"');
  });

  it("falla con formato invalido", async () => {
    await expect(runCli(["export", fixturePath, "--format", "md"])).rejects.toThrow("Formato no soportado: md");
  });

  it("usa la ruta posicional en init", async () => {
    const outPath = join(tmpdir(), `agent-dna-${Date.now()}.yaml`);
    await runCli(["init", outPath]);
    const written = await fs.readFile(outPath, "utf8");
    expect(written).toContain('version: "1.0"');
  });

  it("falla con campo inexistente", async () => {
    await expect(runCli(["show", fixturePath, "--field", "identity.unknown"])).rejects.toThrow(
      "Campo no encontrado: identity.unknown"
    );
  });
});
