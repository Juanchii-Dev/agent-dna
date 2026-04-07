import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildGitHookSnippet, installGitHook } from "./git-hooks";

describe("git-hooks", () => {
  it("genera snippet de pre-commit para validar DNA", () => {
    const snippet = buildGitHookSnippet();
    expect(snippet).toContain("agent-dna validate");
    expect(snippet).toContain("# >>> agent-dna >>>");
  });

  it("instala el hook una sola vez", async () => {
    const hookPath = join(tmpdir(), `agent-dna-pre-commit-${Date.now()}`);

    const first = await installGitHook(hookPath);
    const second = await installGitHook(hookPath);
    const content = await fs.readFile(hookPath, "utf8");

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(content.match(/# >>> agent-dna >>>/g)?.length).toBe(1);
  });
});
