import { spawn } from "node:child_process";
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

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code && code !== 0) {
        rejectPromise(new Error(`Comando falló con exit code ${code}`));
        return;
      }

      resolvePromise();
    });
  });
}
