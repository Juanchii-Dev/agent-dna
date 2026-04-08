import { useState } from "react";
import type { AgentDnaState, LayerId, PlatformPreview } from "@tuwebai/core/browser";
import type { ImportState } from "./app-config";
import { CodeBlockActions } from "./components/code-block-actions";
import { InputField } from "./components/input-field";

type FieldErrors = Partial<Record<keyof AgentDnaState | "schemaVersion", string>>;

type EditorProps = {
  agentsPreview: string;
  dna: AgentDnaState;
  fieldErrors: FieldErrors;
  importState: ImportState;
  layers: Record<LayerId, boolean>;
  onChange: (next: AgentDnaState) => void;
  onCopy: (content: string) => Promise<void>;
  onExport: (filename: string, content: string) => void;
  onImport: () => void;
  onToggleLayer: (layerId: LayerId) => void;
  platformPreviews: PlatformPreview[];
  resolvedJsonPreview: string;
  schemaVersion: string;
  resolvedYamlPreview: string;
}

export function EditorView({
  agentsPreview,
  dna,
  fieldErrors,
  importState,
  onChange,
  onCopy,
  onExport,
  onImport,
  platformPreviews,
  resolvedJsonPreview,
  schemaVersion,
  resolvedYamlPreview,
}: EditorProps) {
  const [previewMode, setPreviewMode] = useState<"yaml" | "json" | "agents" | "platforms">("agents");
  const update = (key: keyof AgentDnaState, value: string) => {
    onChange({ ...dna, [key]: value });
  };

  return (
    <main className="page pageEditor">
      <section className="workspace editorWorkspace">
        <article className="editorCard">
          <div className="panelHeader">
            <span>DNA Editor</span>
            <div className="panelHeaderMeta">
              <label className="schemaSelector">
                <span>Schema</span>
                <select value={schemaVersion} disabled>
                  <option value={schemaVersion}>{schemaVersion}</option>
                  <option value="0.2.0">0.2.0 pronto</option>
                </select>
              </label>
              <span className="statusPill">Draft {dna.version}</span>
            </div>
          </div>
          <div className="importBar">
            <button onClick={onImport} type="button">Import YAML/JSON</button>
            <span className={`importStatus ${importState.tone}`}>{importState.message}</span>
          </div>
          <div className="formGrid">
            <InputField error={fieldErrors.name} label="Nombre" value={dna.name} onChange={(value) => update("name", value)} />
            <InputField error={fieldErrors.role} label="Rol" value={dna.role} onChange={(value) => update("role", value)} />
            <InputField error={fieldErrors.project} label="Proyecto" value={dna.project} onChange={(value) => update("project", value)} />
            <InputField error={fieldErrors.stack} label="Stack" value={dna.stack} onChange={(value) => update("stack", value)} />
            <InputField error={fieldErrors.tone} label="Tono" value={dna.tone} onChange={(value) => update("tone", value)} />
            <InputField error={fieldErrors.language} label="Idioma" value={dna.language} onChange={(value) => update("language", value)} />
            <InputField error={fieldErrors.alwaysRule} label="Always rule" value={dna.alwaysRule} onChange={(value) => update("alwaysRule", value)} />
            <InputField error={fieldErrors.neverRule} label="Never rule" value={dna.neverRule} onChange={(value) => update("neverRule", value)} />
            <InputField error={fieldErrors.boundaryRule} label="Boundary" value={dna.boundaryRule} onChange={(value) => update("boundaryRule", value)} />
            <InputField error={fieldErrors.business} label="Business" value={dna.business} onChange={(value) => update("business", value)} />
          </div>
        </article>

        <article className="sideCard previewCard compactPreviewCard">
          <div className="panelHeader previewHeader">
            <span>Generated outputs</span>
            <div className="previewHeaderRight">
              <span className="statusDot">{dna.product}</span>
            </div>
          </div>
          <div className="previewTabs">
            <button
              className={previewMode === "agents" ? "previewTab active" : "previewTab"}
              onClick={() => setPreviewMode("agents")}
              type="button"
            >
              AGENTS.md
            </button>
            <button
              className={previewMode === "yaml" ? "previewTab active" : "previewTab"}
              onClick={() => setPreviewMode("yaml")}
              type="button"
            >
              Resolved DNA
            </button>
            <button
              className={previewMode === "json" ? "previewTab active" : "previewTab"}
              onClick={() => setPreviewMode("json")}
              type="button"
            >
              JSON
            </button>
            <button
              className={previewMode === "platforms" ? "previewTab active" : "previewTab"}
              onClick={() => setPreviewMode("platforms")}
              type="button"
            >
              Platforms
            </button>
          </div>
          <div className="previewBody">
            {previewMode === "agents" ? (
              <>
                <CodeBlockActions
                  content={agentsPreview}
                  filename="AGENTS.md"
                  onCopy={onCopy}
                  onExport={onExport}
                />
              </>
            ) : null}
            {previewMode === "yaml" ? (
              <>
                <CodeBlockActions
                  content={resolvedYamlPreview}
                  filename="agent-dna.yaml"
                  onCopy={onCopy}
                  onExport={onExport}
                />
              </>
            ) : null}
            {previewMode === "json" ? (
              <>
                <CodeBlockActions
                  content={resolvedJsonPreview}
                  filename="agent-dna.json"
                  onCopy={onCopy}
                  onExport={onExport}
                />
              </>
            ) : null}
            {previewMode === "platforms" ? (
              <div className="platformGrid">
                {platformPreviews.map((preview) => (
                  <section className="platformPreview" key={preview.name}>
                    <strong>{preview.name}</strong>
                    <pre>{preview.content}</pre>
                    <button onClick={() => onExport(`${preview.name.toLowerCase()}.md`, preview.content)} type="button">
                      Export
                    </button>
                  </section>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
