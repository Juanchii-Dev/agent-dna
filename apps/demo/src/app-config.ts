import type { NavTab } from "./data";

export const tabs: { id: NavTab; label: string }[] = [
  { id: "landing", label: "Landing" },
  { id: "editor", label: "DNA Editor" },
  { id: "marketplace", label: "Marketplace" },
];

export const STORAGE_KEY = "agent-dna-demo-state";
export const LAYERS_KEY = "agent-dna-demo-layers";

export type ImportTone = "neutral" | "success" | "warning" | "danger";

export type ImportState = {
  message: string;
  tone: ImportTone;
};
