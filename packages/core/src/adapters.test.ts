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
    const output = renderAdapter("claude", initialDnaDocument, initialDna);
    expect(output).toContain("# Claude System Prompt");
    expect(output).toContain("## Never");
  });

  it("renderiza chatgpt como personalizacion persistente", () => {
    const output = renderAdapter("chatgpt", initialDnaDocument, initialDna);
    expect(output).toContain("# ChatGPT Personalization");
    expect(output).toContain("## Acerca de ti");
    expect(output).toContain("## Como quiero que respondas");
    expect(output).not.toContain("Use `any` type in TypeScript");
    expect(output).not.toContain("service_role");
    expect(output).not.toContain("PowerShell");
  });

  it("renderiza stdout como documento canonico yaml", () => {
    expect(renderAdapter("stdout", initialDnaDocument, initialDna)).toContain('version: "1.0"');
  });
});
