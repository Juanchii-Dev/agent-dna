import { describe, expect, it } from "vitest";
import { renderAdapter } from "./adapters";
import { initialDna, initialDnaDocument } from "./schema";

describe("adapters", () => {
  it("renderiza codex como AGENTS", () => {
    expect(renderAdapter("codex", initialDnaDocument, initialDna)).toContain("# AGENTS.md");
  });

  it("renderiza cursor como reglas dedicadas", () => {
    expect(renderAdapter("cursor", initialDnaDocument, initialDna)).toContain("cursor_context:");
  });

  it("renderiza claude desde package dedicado", () => {
    expect(renderAdapter("claude", initialDnaDocument, initialDna)).toContain("claude_memory:");
  });

  it("renderiza stdout como documento canonico yaml", () => {
    expect(renderAdapter("stdout", initialDnaDocument, initialDna)).toContain('version: "1.0"');
  });
});
