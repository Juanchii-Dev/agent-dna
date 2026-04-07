import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";
import {
  buildDocumentJson,
  buildDocumentYaml,
  getAdapter,
  initialDnaDocument,
  mapDocumentToState,
} from "../../core/src/index";
import type { DnaAdapterName } from "../../core/src/index";
import {
  getActiveOverridePath,
  getArg,
  getFieldValue,
  getFormat,
  getTool,
  loadResolvedDocument,
  resolveBaseDnaPath,
  resolveOverridePath,
  USAGE
} from "./cli-shared";
import { runWrappedCommand } from "./run-command";
import { buildPowerShellHookSnippet, installPowerShellHook } from "./shell-hooks";

type Command =
  | "export"
  | "export-agents"
  | "help"
  | "hook"
  | "init"
  | "inject"
  | "override"
  | "run"
  | "resolve"
  | "show"
  | "validate";

async function writeOutput(outPath: string | null, output: string, successMessage: string) {
  if (!outPath) {
    console.log(output);
    return;
  }

  const absolutePath = resolve(outPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, output, "utf8");
  console.log(`${successMessage} ${absolutePath}`);
}

async function handleInit(args: string[]) {
  const positionalPath = args[0] && !args[0].startsWith("--") ? args[0] : null;
  const outPath = resolve(getArg("--out", args) ?? positionalPath ?? ".agent-dna/dna.yaml");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buildDocumentYaml(initialDnaDocument), "utf8");
  console.log(`DNA inicial creado en ${outPath}`);
}

async function handleValidate(filePath: string, args: string[]) {
  await loadResolvedDocument(filePath, args);
  console.log("agent_dna valido");
}

async function handleShow(filePath: string, args: string[]) {
  const document = await loadResolvedDocument(filePath, args);
  const field = getArg("--field", args);
  const format = getFormat(args);
  const selected = getFieldValue(document as Record<string, unknown>, field);
  const output =
    format === "json"
      ? JSON.stringify(selected, null, 2)
      : typeof selected === "object" && selected !== null
        ? YAML.stringify(selected).trimEnd()
        : String(selected);

  console.log(output);
}

async function handleExport(filePath: string, args: string[]) {
  const document = await loadResolvedDocument(filePath, args);
  const outPath = getArg("--out", args);
  const format = getFormat(args);
  const output = format === "json" ? buildDocumentJson(document) : buildDocumentYaml(document);
  await writeOutput(outPath, output, "DNA exportado en");
}

async function handleInject(filePath: string, args: string[]) {
  const tool = getTool(args);
  const document = await loadResolvedDocument(filePath, args);
  const state = mapDocumentToState(document);
  const adapter = getAdapter(tool);
  const output = adapter.transform({ document, state });
  const outPath = getArg("--out", args);
  await writeOutput(outPath, output, `${tool} exportado en`);
}

async function handleOverride(target: string | null, args: string[]) {
  const activeOverridePath = getActiveOverridePath();

  if (target === "--clear" || args.includes("--clear")) {
    await rm(activeOverridePath, { force: true });
    console.log("Override activo limpiado");
    return;
  }

  if (!target) {
    throw new Error("Falta override");
  }

  const overridePath = await resolveOverridePath(target);
  await mkdir(dirname(activeOverridePath), { recursive: true });
  await writeFile(activeOverridePath, overridePath, "utf8");
  console.log(`Override activo: ${overridePath}`);
}

async function handleHook(target: string | null, args: string[]) {
  if (target !== "powershell") {
    throw new Error("Solo se soporta powershell en este slice");
  }

  if (args.includes("--install")) {
    const profilePath = getArg("--profile", args);
    const result = await installPowerShellHook(profilePath);
    console.log(result.created ? `Hook PowerShell instalado en ${result.path}` : `Hook PowerShell ya presente en ${result.path}`);
    return;
  }

  console.log(buildPowerShellHookSnippet());
}

export async function runCli(argv: string[]) {
  const [rawCommand, ...inputArgs] = argv;
  const command = rawCommand as Command | undefined;
  const rawFile = inputArgs[0] && !inputArgs[0].startsWith("--") ? inputArgs[0] : null;
  const rest = rawFile ? inputArgs.slice(1) : inputArgs;

  if (!command || command === "help" || rest.includes("--help")) {
    console.error(USAGE);
    return 1;
  }

  if (command === "init") {
    await handleInit(rawFile ? [rawFile, ...rest] : rest);
    return 0;
  }

  if (command === "override") {
    await handleOverride(rawFile, rest);
    return 0;
  }

  if (command === "hook") {
    await handleHook(rawFile, rest);
    return 0;
  }

  if (command === "run") {
    await runWrappedCommand({ args: inputArgs });
    return 0;
  }

  const filePath = await resolveBaseDnaPath(rawFile);

  switch (command) {
    case "validate":
      await handleValidate(filePath, rest);
      break;
    case "show":
      await handleShow(filePath, rest);
      break;
    case "export":
    case "resolve":
      await handleExport(filePath, rest);
      break;
    case "inject":
      await handleInject(filePath, rest);
      break;
    case "export-agents":
      await handleInject(filePath, ["--tool", "codex", ...rest]);
      break;
    default:
      throw new Error(`Comando no soportado: ${rawCommand}`);
  }

  return 0;
}

async function main() {
  const exitCode = await runCli(process.argv.slice(2));
  process.exit(exitCode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(message);
    process.exit(1);
  });
}
