import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { marketplaceCards, marketplaceTemplates, pillars, stats, type NavTab } from "./data";
import {
  AgentDnaImportError,
  buildAgentsPreview,
  buildJsonPreview,
  buildPlatformPreviews,
  buildYamlPreview,
  initialDna,
  initialDnaDocument,
  parseImportedDocument,
  parseImportedDna,
  resolveDna,
  schemaMetadata,
  syncDocumentWithState,
  type AgentDnaDocument,
  type AgentDnaState,
  type LayerId,
} from "@agent-dna/core/browser";
import { AppHeader } from "./app-header";
import { LAYERS_KEY, STORAGE_KEY, tabs, type ImportState } from "./app-config";
import { mapImportIssuesToFields } from "./import-errors";
import { LandingView } from "./landing-view";
import { MarketplaceView } from "./marketplace-view";
import { EditorView } from "./views";

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("landing");
  const [dna, setDna] = useState<AgentDnaState>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return initialDna;
    }

    try {
      return { ...initialDna, ...(JSON.parse(saved) as Partial<AgentDnaState>) };
    } catch {
      return initialDna;
    }
  });
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(() => {
    const saved = window.localStorage.getItem(LAYERS_KEY);
    if (!saved) {
      return { project: true, team: true };
    }

    try {
      return {
        project: true,
        team: true,
        ...(JSON.parse(saved) as Partial<Record<LayerId, boolean>>),
      };
    } catch {
      return { project: true, team: true };
    }
  });
  const [importState, setImportState] = useState<ImportState>({
    message: `Local-first. Importa YAML o JSON compatible con schema ${schemaMetadata.version}.`,
    tone: "neutral",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [dnaDocument, setDnaDocument] = useState<AgentDnaDocument>(initialDnaDocument);

  const overrides = {} as Record<LayerId, Partial<AgentDnaState>>;
  const resolvedDna = resolveDna(dna, layers, overrides);
  const resolvedYamlPreview = buildYamlPreview(resolvedDna, dnaDocument);
  const resolvedJsonPreview = buildJsonPreview(resolvedDna, dnaDocument);
  const agentsPreview = buildAgentsPreview(resolvedDna);
  const platformPreviews = buildPlatformPreviews(resolvedDna);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
  }, [dna]);

  useEffect(() => {
    window.localStorage.setItem(LAYERS_KEY, JSON.stringify(layers));
  }, [layers]);

  const applyTemplate = (name: string) => {
    const template = marketplaceTemplates[name];
    if (!template) {
      return;
    }

    setDna((current) => ({ ...current, ...template }));
    setDnaDocument((current) => syncDocumentWithState({ ...dna, ...template }, current));
    setFieldErrors({});
    setImportState({
      message: `Template aplicado: ${name}`,
      tone: "success",
    });
    setActiveTab("editor");
  };

  const toggleLayer = (layerId: LayerId) => {
    setLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  };

  const exportFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const openImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const importedDocument = parseImportedDocument(content, file.name.toLowerCase());
      const parsed = parseImportedDna(content, file.name.toLowerCase());
      setDna(parsed);
      setDnaDocument(importedDocument);
      setFieldErrors({});
      setImportState({
        message: `Importado OK: ${file.name} · schema ${schemaMetadata.version} compatible`,
        tone: "success",
      });
      setActiveTab("editor");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setFieldErrors(error instanceof AgentDnaImportError ? mapImportIssuesToFields(error.issues) : {});
      setImportState({
        message: `Import fallido: ${message}`,
        tone: message.includes("schema_version no soportado") ? "warning" : "danger",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="shell">
      <input
        accept=".yaml,.yml,.json"
        className="hiddenInput"
        onChange={handleImport}
        ref={fileInputRef}
        type="file"
      />
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      {activeTab === "landing" ? (
        <LandingView
          onOpenEditor={() => setActiveTab("editor")}
          onOpenMarketplace={() => setActiveTab("marketplace")}
          pillars={pillars}
          stats={stats}
          yamlPreview={resolvedYamlPreview}
        />
      ) : null}

      {activeTab === "editor" ? (
        <EditorView
          agentsPreview={agentsPreview}
          dna={dna}
          fieldErrors={fieldErrors}
          importState={importState}
          layers={layers}
          onChange={setDna}
          onCopy={copyToClipboard}
          onExport={exportFile}
          onImport={openImport}
          onToggleLayer={toggleLayer}
          platformPreviews={platformPreviews}
          resolvedJsonPreview={resolvedJsonPreview}
          schemaVersion={schemaMetadata.version}
          resolvedYamlPreview={resolvedYamlPreview}
        />
      ) : null}

      {activeTab === "marketplace" ? (
        <MarketplaceView cards={marketplaceCards} onClone={applyTemplate} />
      ) : null}
    </div>
  );
}
