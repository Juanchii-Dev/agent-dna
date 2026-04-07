import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPowerShellHookSnippet, installPowerShellHook } from "./shell-hooks";

describe("shell-hooks", () => {
  it("genera snippet de PowerShell para dna run", () => {
    const snippet = buildPowerShellHookSnippet();
    expect(snippet).toContain("agent-dna run --tool $Tool -- @CommandArgs");
    expect(snippet).toContain("Set-Alias dna-ai Invoke-AgentDnaRun");
  });

  it("instala el hook una sola vez", async () => {
    const profilePath = join(tmpdir(), `agent-dna-profile-${Date.now()}.ps1`);

    const first = await installPowerShellHook(profilePath);
    const second = await installPowerShellHook(profilePath);
    const content = await fs.readFile(profilePath, "utf8");

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(content.match(/# >>> agent-dna >>>/g)?.length).toBe(1);
  });
});
