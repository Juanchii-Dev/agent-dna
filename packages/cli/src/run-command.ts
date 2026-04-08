import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { buildDocumentJson, mapDocumentToState } from "@agent-dna/core";
import { getArg, getTool, loadResolvedDocument, resolveBaseDnaPath } from "./cli-shared";

type RunCommandInput = {
  args: string[];
};

function getExecutableArgs(args: string[]) {
  const separatorIndex = args.indexOf("--");
  const commandArgs = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : args.filter((arg, index) => {
    if (arg.startsWith("--")) {
      return false;
    }

    const previous = args[index - 1];
    return previous !== "--tool" && previous !== "--dna" && previous !== "--override" && previous !== "--dnaignore";
  });

  if (commandArgs.length === 0) {
    throw new Error("Falta comando para dna run");
  }

  return commandArgs;
}

function isScriptInterpreter(command: string) {
  return ["node", "node.exe", "tsx", "tsx.cmd", "bun", "bun.exe", "python", "python.exe", "python3"].includes(command);
}

function shouldSkipScriptCheck(scriptArg: string) {
  return scriptArg.startsWith("-");
}

async function assertScriptExists(command: string, commandArgs: string[]) {
  if (!isScriptInterpreter(command) || commandArgs.length === 0) {
    return;
  }

  const scriptArg = commandArgs[0];
  if (shouldSkipScriptCheck(scriptArg)) {
    return;
  }

  const scriptPath = resolve(process.cwd(), scriptArg);
  try {
    await access(scriptPath);
  } catch {
    throw new Error(`Archivo de script no encontrado: ${scriptPath}`);
  }
}

export async function runWrappedCommand({ args }: RunCommandInput) {
  const tool = getTool(args, "stdout");
  const dnaPath = await resolveBaseDnaPath(getArg("--dna", args));
  const document = await loadResolvedDocument(dnaPath, [
    ...args.filter((arg, index) => {
      if (arg === "--") {
        return false;
      }

      const previous = args[index - 1];
      if (arg.startsWith("--")) {
        return arg === "--tool" || arg === "--override" || arg === "--dnaignore";
      }

      return previous === "--tool" || previous === "--override" || previous === "--dnaignore";
    }),
    "--tool",
    tool
  ]);
  const state = mapDocumentToState(document);
  const injection = buildDocumentJson(document);
  const [command, ...commandArgs] = getExecutableArgs(args);
  await assertScriptExists(command, commandArgs);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      env: {
        ...process.env,
        AGENT_DNA_JSON: injection,
        AGENT_DNA_PATH: dnaPath,
        AGENT_DNA_PROJECT: state.project,
        AGENT_DNA_TOOL: tool
      }
    });

    child.on("error", (error) => {
      if ("code" in error && error.code === "ENOENT") {
        rejectPromise(new Error(`Comando no encontrado: ${command}`));
        return;
      }

      rejectPromise(error);
    });
    child.on("exit", (code) => {
      if (code && code !== 0) {
        rejectPromise(new Error(`Comando falló con exit code ${code}`));
        return;
      }

      resolvePromise();
    });
  });
}
