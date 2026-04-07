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
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;
  beforeEach(() => {
    logSpy.mockClear();
    errorSpy.mockClear();
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
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

  it("activa override por nombre y lo aplica al DNA global", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}`);
    const dnaHome = join(tempHome, ".agent-dna");
    const overridesDir = join(dnaHome, "overrides");
    await fs.mkdir(overridesDir, { recursive: true });
    await fs.writeFile(join(dnaHome, "dna.yaml"), await fs.readFile(fixturePath, "utf8"), "utf8");
    await fs.writeFile(join(overridesDir, "pulse.yaml"), "identity:\n  role: Override role\n", "utf8");
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    await runCli(["override", "pulse"]);
    await runCli(["show", "--field", "identity.role", "--format", "json"]);

    expect(logSpy).toHaveBeenLastCalledWith('"Override role"');
  });

  it("limpia el override activo", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}-clear`);
    const dnaHome = join(tempHome, ".agent-dna");
    const overridesDir = join(dnaHome, "overrides");
    await fs.mkdir(overridesDir, { recursive: true });
    await fs.writeFile(join(dnaHome, "dna.yaml"), await fs.readFile(fixturePath, "utf8"), "utf8");
    await fs.writeFile(join(overridesDir, "pulse.yaml"), "identity:\n  role: Override role\n", "utf8");
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    await runCli(["override", "pulse"]);
    await runCli(["override", "--clear"]);
    await runCli(["show", "--field", "identity.role", "--format", "json"]);

    expect(logSpy).toHaveBeenLastCalledWith('"Fullstack Founder"');
  });

  it("ejecuta dna run con el DNA inyectado en variables de entorno", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}-run`);
    const dnaHome = join(tempHome, ".agent-dna");
    await fs.mkdir(dnaHome, { recursive: true });
    await fs.writeFile(join(dnaHome, "dna.yaml"), await fs.readFile(fixturePath, "utf8"), "utf8");
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    const outPath = join(tmpdir(), `agent-dna-run-${Date.now()}.txt`);
    await runCli([
      "run",
      "--tool",
      "codex",
      "--",
      "node",
      "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(outPath)}, process.env.AGENT_DNA_TOOL + '|' + process.env.AGENT_DNA_PROJECT)`
    ]);

    const output = await fs.readFile(outPath, "utf8");
    expect(output).toBe("codex|Pulse");
  });

  it("muestra diff entre DNA base y override", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}-diff`);
    const dnaHome = join(tempHome, ".agent-dna");
    const overridesDir = join(dnaHome, "overrides");
    const dnaPath = join(dnaHome, "dna.yaml");
    await fs.mkdir(overridesDir, { recursive: true });
    await fs.writeFile(dnaPath, await fs.readFile(fixturePath, "utf8"), "utf8");
    await fs.writeFile(join(overridesDir, "pulse.yaml"), "identity:\n  role: Override role\n", "utf8");
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    await runCli(["diff", dnaPath, "pulse"]);

    expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining("identity.role"));
  });
});
