import { describe, expect, it } from "vitest";
import { buildAgentsPreview, buildJsonPreview, buildPlatformPreviews, buildYamlPreview } from "./generators";
import { initialDna, initialDnaDocument } from "./schema";

describe("generators", () => {
  it("genera yaml con bloque raiz", () => {
    expect(buildYamlPreview(initialDna)).toContain("version:");
  });

  it("genera AGENTS con contexto activo", () => {
    const preview = buildAgentsPreview(initialDna);
    expect(preview).toContain("## Contexto activo");
    expect(preview).toContain("## NUNCA hacer");
    expect(preview).toContain("NEVER:");
  });

  it("genera json parseable", () => {
    const parsed = JSON.parse(buildJsonPreview(initialDna)) as { identity: { name: string } };
    expect(parsed.identity.name).toBe(initialDna.name);
  });

  it("genera tres previews de plataforma", () => {
    expect(buildPlatformPreviews(initialDna)).toHaveLength(3);
  });

  it("preserva arrays extra al exportar desde documento canonico", () => {
    const document = structuredClone(initialDnaDocument);
    document.rules?.always?.push("priorizar contexto de negocio");

    const parsed = JSON.parse(buildJsonPreview(initialDna, document)) as { rules: { always: string[] } };
    expect(parsed.rules.always).toContain("priorizar contexto de negocio");
  });
});
