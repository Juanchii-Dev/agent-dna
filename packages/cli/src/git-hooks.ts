import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const HOOK_START = "# >>> agent-dna >>>";
const HOOK_END = "# <<< agent-dna <<<";

export function resolveGitHookPath(customPath?: string | null) {
  if (customPath) {
    return resolve(customPath);
  }

  return resolve(process.cwd(), ".git", "hooks", "pre-commit");
}

export function buildGitHookSnippet(command = "agent-dna") {
  return [
    HOOK_START,
    `${command} validate`,
    HOOK_END
  ].join("\n");
}

export async function installGitHook(hookPath?: string | null, command = "agent-dna") {
  const absolutePath = resolveGitHookPath(hookPath);
  const existing = await readOptionalFile(absolutePath);
  const snippet = buildGitHookSnippet(command);

  if (existing?.includes(HOOK_START)) {
    return { created: false, path: absolutePath };
  }

  const nextContent = existing?.trimEnd() ? `${existing.trimEnd()}\n\n${snippet}\n` : `${snippet}\n`;
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, nextContent, "utf8");
  await chmod(absolutePath, 0o755);
  return { created: true, path: absolutePath };
}

async function readOptionalFile(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}
