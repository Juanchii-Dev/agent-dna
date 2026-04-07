import { describe, expect, it } from "vitest";
import { applyDnaIgnore, mergeDnaDocuments, parseDnaIgnore, parseOverrideDocument } from "./overrides";
import { initialDnaDocument } from "./schema";

describe("overrides", () => {
  it("mergea override parcial sobre documento canonico", () => {
    const override = {
      context: {
        active_project: "Pulse Enterprise"
      },
      preferences: {
        tone: "claro, enterprise"
      },
      projects: [
        {
          id: "pulse-enterprise",
          name: "Pulse Enterprise"
        }
      ]
    };

    const merged = mergeDnaDocuments(initialDnaDocument, override);
    expect(merged.context?.active_project).toBe("Pulse Enterprise");
    expect(merged.preferences?.tone).toBe("claro, enterprise");
    expect(merged.projects?.[0].id).toBe("pulse-enterprise");
  });

  it("parsea override yaml parcial", () => {
    const override = parseOverrideDocument(
      `context:
  active_project: "Pulse Enterprise"
preferences:
  tone: "claro, enterprise"`,
      "pulse.yaml"
    );

    expect(override.context?.active_project).toBe("Pulse Enterprise");
    expect(override.preferences?.tone).toBe("claro, enterprise");
  });

  it("parsea .dnaignore por herramienta", () => {
    const config = parseDnaIgnore(
      `codex:
  - custom.policy
  - db_contracts
cursor:
  - projects`
    );

    expect(config.codex).toEqual(["custom.policy", "db_contracts"]);
    expect(config.cursor).toEqual(["projects"]);
  });

  it("aplica .dnaignore al documento para una herramienta", () => {
    const ignored = applyDnaIgnore(
      initialDnaDocument,
      "codex",
      parseDnaIgnore(
        `codex:
  - custom.policy
  - db_contracts
  - projects`
      )
    );

    expect(ignored.custom?.policy).toBeUndefined();
    expect(ignored).not.toHaveProperty("db_contracts");
    expect(ignored).not.toHaveProperty("projects");
  });
});
