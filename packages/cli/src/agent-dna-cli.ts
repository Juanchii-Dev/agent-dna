import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";
import {
  applyDnaIgnore,
  buildDocumentJson,
  buildDocumentYaml,
  getAdapter,
  initialDnaDocument,
  mapDocumentToState,
  mergeDnaDocuments,
  parseDnaIgnore,
  parseImportedDocument,
  parseOverrideDocument,
  renderAdapter
} from "../../core/src/index";
import type { DnaAdapterName } from "../../core/src/index";

type Command =
  | "export"
  | "export-agents"
  | "help"
  | "init"
  | "inject"
  | "resolve"
  | "show"
  | "validate";

const SUPPORTED_FORMATS = ["yaml", "json"] as const;
const SUPPORTED_TOOLS = ["stdout", "codex", "cursor", "claude"] as const;
const USAGE =
  "Uso: npm run cli -- <init|show|validate|export|inject|resolve|export-agents> [archivo] [--format yaml|json] [--out ruta] [--override ruta] [--tool codex|cursor|claude|stdout] [--dnaignore ruta] [--field ruta.dot]";

function getArg(flag: string, args: string[]) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
}

function getFormat(args: string[]) {
  const format = (getArg("--format", args) ?? "yaml") as (typeof SUPPORTED_FORMATS)[number];
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Formato no soportado: ${format}`);
  }
  return format;
}

function getTool(args: string[], fallback: DnaAdapterName = "stdout") {
  const tool = (getArg("--tool", args) ?? fallback) as DnaAdapterName;
  if (!SUPPORTED_TOOLS.includes(tool)) {
    throw new Error(`Tool no soportado: ${tool}`);
  }
  return tool;
}

function getFieldValue(document: Record<string, unknown>, field: string | null) {
  if (!field) {
    return document;
  }

  const value = field.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      throw new Error(`Campo no encontrado: ${field}`);
    }
    return (current as Record<string, unknown>)[segment];
  }, document);

  return value;
}

async function readOptionalFile(filePath: string | null) {
  if (!filePath) {
    return null;
  }

  try {
    return await readFile(resolve(filePath), "utf8");
  } catch {
    return null;
  }
}

async function resolveDnaIgnorePath(dnaPath: string, args: string[]) {
  const explicit = getArg("--dnaignore", args);
  if (explicit) {
    return resolve(explicit);
  }

  const sibling = resolve(dirname(dnaPath), ".dnaignore");
  const siblingContent = await readOptionalFile(sibling);
  return siblingContent ? sibling : null;
}

async function loadResolvedDocument(filePath: string, args: string[]) {
  const absolutePath = resolve(filePath);
  const baseContent = await readFile(absolutePath, "utf8");
  const baseDocument = parseImportedDocument(baseContent, absolutePath.toLowerCase());

  const overridePath = getArg("--override", args);
  const overrideContent = await readOptionalFile(overridePath);
  const mergedDocument = overrideContent
    ? mergeDnaDocuments(baseDocument, parseOverrideDocument(overrideContent, resolve(overridePath!).toLowerCase()))
    : baseDocument;

  const tool = getArg("--tool", args) as DnaAdapterName | null;
  if (!tool) {
    return mergedDocument;
  }

  const dnaIgnorePath = await resolveDnaIgnorePath(absolutePath, args);
  const dnaIgnoreContent = await readOptionalFile(dnaIgnorePath);
  return dnaIgnoreContent ? applyDnaIgnore(mergedDocument, tool, parseDnaIgnore(dnaIgnoreContent)) : mergedDocument;
}

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

export async function runCli(argv: string[]) {
  const [rawCommand, rawFile, ...rest] = argv;
  const command = rawCommand as Command | undefined;

  if (!command || command === "help" || rest.includes("--help")) {
    console.error(USAGE);
    return 1;
  }

  if (command === "init") {
    await handleInit(rawFile ? [rawFile, ...rest] : rest);
    return 0;
  }

  if (!rawFile) {
    throw new Error("Falta archivo DNA");
  }

  switch (command) {
    case "validate":
      await handleValidate(rawFile, rest);
      break;
    case "show":
      await handleShow(rawFile, rest);
      break;
    case "export":
    case "resolve":
      await handleExport(rawFile, rest);
      break;
    case "inject":
      await handleInject(rawFile, rest);
      break;
    case "export-agents":
      await handleInject(rawFile, ["--tool", "codex", ...rest]);
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
