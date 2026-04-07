export type LayerId = "team" | "project";

export type AgentDnaOverrideDocument = Partial<AgentDnaDocument>;

export type DnaIgnoreConfig = Record<string, string[]>;

export type DnaAdapterName = "stdout" | "codex" | "cursor" | "claude";

export type DnaAdapterInput = {
  document: AgentDnaDocument;
  state: AgentDnaState;
};

export type DnaAdapter = {
  name: DnaAdapterName;
  version: string;
  fileName?: string;
  transform: (input: DnaAdapterInput) => string;
  inject: (output: string) => Promise<void>;
};

export type AgentDnaDocument = {
  context?: {
    active_project?: string;
    active_sprint?: string;
    os?: string;
    shell?: string;
  };
  custom?: Record<string, unknown>;
  db_contracts?: {
    forbidden_fields?: string[];
    tables?: Record<string, string | Record<string, string>>;
    valid_notification_categories?: string[];
    valid_notification_types?: string[];
  };
  identity: {
    experience_years?: number;
    language?: string;
    name: string;
    output_language?: string;
    role: string;
    timezone?: string;
  };
  preferences?: {
    ask_clarification?: string;
    code_comments?: string;
    explanation_depth?: string;
    tone?: string;
  };
  projects?: Array<{
    id: string;
    name: string;
    repo?: string;
    rules_file?: string;
    stack?: string[];
  }>;
  rules?: {
    always?: string[];
    formatting?: string[];
    never?: string[];
  };
  stack: {
    avoid?: string[];
    backend?: string[];
    primary: string[];
    tools?: string[];
  };
  version: string;
};

export type LegacyAgentDnaDocument = {
  agent_dna: {
    context?: {
      active_project?: string;
      business?: string;
    };
    identity: {
      name: string;
      role: string;
      stack?: string[] | string;
    };
    meta: {
      dna_version: string;
      schema_version: string;
      visibility: string;
    };
    policy?: {
      approval_mode?: string;
      secret_policy?: string;
    };
    preferences?: {
      language?: string;
      tone?: string;
    };
    rules: {
      always?: string[];
      never?: string[];
    };
  };
};

export type AgentDnaState = {
  alwaysRule: string;
  approvalMode: string;
  boundaryRule: string;
  business: string;
  language: string;
  languageLabel: string;
  languageRule: string;
  name: string;
  neverRule: string;
  product: string;
  project: string;
  role: string;
  secretPolicy: string;
  stack: string;
  tone: string;
  version: string;
  visibility: string;
};

export type PlatformPreview = { content: string; name: string };
