import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const HOOK_START = "# >>> agent-dna >>>";
const HOOK_END = "# <<< agent-dna <<<";

export function resolvePowerShellProfilePath(customPath?: string | null) {
  if (customPath) {
    return resolve(customPath);
  }

  const home = process.env.USERPROFILE ?? process.env.HOME;
  if (!home) {
    throw new Error("No se pudo resolver HOME para PowerShell profile");
  }

  return resolve(home, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
}

export function buildPowerShellHookSnippet(command = "agent-dna") {
  return [
    HOOK_START,
    "function Invoke-AgentDnaRun {",
    "  param(",
    "    [string]$Tool = \"stdout\",",
    "    [Parameter(ValueFromRemainingArguments = $true)]",
    "    [string[]]$CommandArgs",
    "  )",
    "",
    `  & ${command} run --tool $Tool -- @CommandArgs`,
    "}",
    "",
    "Set-Alias dna-ai Invoke-AgentDnaRun",
    HOOK_END
  ].join("\n");
}

export async function installPowerShellHook(profilePath?: string | null, command = "agent-dna") {
  const absolutePath = resolvePowerShellProfilePath(profilePath);
  const existing = await readOptionalFile(absolutePath);
  const snippet = buildPowerShellHookSnippet(command);

  if (existing?.includes(HOOK_START)) {
    return { created: false, path: absolutePath };
  }

  const nextContent = existing?.trimEnd() ? `${existing.trimEnd()}\n\n${snippet}\n` : `${snippet}\n`;
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, nextContent, "utf8");
  return { created: true, path: absolutePath };
}

async function readOptionalFile(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}
