import { beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
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

  it("usa la ruta global por defecto en init", async () => {
    const tempHome = join(tmpdir(), `agent-dna-home-${Date.now()}-init`);
    const dnaPath = join(tempHome, ".agent-dna", "dna.yaml");
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;

    await runCli(["init"]);

    const written = await fs.readFile(dnaPath, "utf8");
    expect(written).toContain('version: "1.0"');
    expect(logSpy).toHaveBeenLastCalledWith(`DNA inicial creado en ${dnaPath}`);
  });

  it("muestra help global sin requerir DNA", async () => {
    const exitCode = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Comandos principales"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("agent-dna inject --tool codex"));
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

  it("inyecta AGENTS.md real en el directorio actual", async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), "agent-dna-inject-"));
    const previousCwd = process.cwd();
    process.chdir(tempDir);

    try {
      await runCli(["inject", fixturePath, "--tool", "codex"]);
      const written = await fs.readFile(join(tempDir, "AGENTS.md"), "utf8");
      expect(written).toContain("Protocolo Core Agent DNA");
      expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining("AGENTS.md"));
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("inyecta personalizacion de chatgpt en el directorio actual", async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), "agent-dna-chatgpt-"));
    const previousCwd = process.cwd();
    process.chdir(tempDir);

    try {
      await runCli(["inject", fixturePath, "--tool", "chatgpt"]);
      const written = await fs.readFile(join(tempDir, "chatgpt-personalization.md"), "utf8");
      expect(written).toContain("# ChatGPT Personalization");
      expect(written).toContain("## Acerca de ti");
      expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining("chatgpt-personalization.md"));
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("importa AGENTS y CONTEXT a archivos portables", async () => {
    const tempRepo = await fs.mkdtemp(join(tmpdir(), "agent-dna-repo-"));
    await fs.writeFile(
      join(tempRepo, "AGENTS.md"),
      "# AGENTS\n- responder siempre en espaÃ±ol latino\n- Output in Latino Spanish with correct tildes\n- nunca usar any en TypeScript\n- Use `any` type in TypeScript\n- usar PowerShell con ;\n- no justificar con â€œpor seguridadâ€ sin riesgo concreto\n",
      "utf8"
    );
    await fs.writeFile(join(tempRepo, "CONTEXT.md"), "active_project: Pulse\n", "utf8");

    await runCli(["import-repo", tempRepo]);

    const baseFile = await fs.readFile(join(tempRepo, ".agent-dna", "imports", `${basename(tempRepo)}.yaml`), "utf8");
    const overrideFile = await fs.readFile(
      join(tempRepo, ".agent-dna", "imports", `${basename(tempRepo)}.override.yaml`),
      "utf8"
    );
    const reportFile = await fs.readFile(
      join(tempRepo, ".agent-dna", "imports", `${basename(tempRepo)}.import-report.md`),
      "utf8"
    );
    expect(baseFile).toContain("responder siempre en español latino");
    expect(baseFile).not.toContain("db_contracts:");
    expect(baseFile).not.toContain("import_candidates:");
    expect(baseFile).toContain("“por seguridad”");
    expect(overrideFile).toContain("active_project: Pulse");
    expect(overrideFile).not.toContain("identity:");
    expect(overrideFile).not.toContain("rules:");
    expect(reportFile).toContain("# Import Report");
    expect(reportFile).toContain("## Accepted");
    expect(reportFile).toContain("Output in Latino Spanish with correct tildes");
    expect(reportFile).toContain("“por seguridad”");
    expect(reportFile).toContain("AGENTS.md > AGENTS");
  });
});
