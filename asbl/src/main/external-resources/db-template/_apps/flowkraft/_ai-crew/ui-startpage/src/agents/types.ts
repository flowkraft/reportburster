/**
 * Agent configuration structure for FlowKraft AI Crew
 */
export interface AgentConfig {
  /** Unique identifier (lowercase, no spaces) */
  id: string;

  /** Short name for internal use */
  name: string;

  /** Full display name shown in UI */
  displayName: string;

  /** Agent's role/title */
  role: string;

  /** Searchable tags for categorization */
  tags: string[];

  /** Brief description of capabilities */
  description: string;

  /** Guidance on when to use this agent */
  whenToUse: string;

  /** Flag indicating this is an advisor, not a code generator */
  notForCoding: boolean;

  /** Hint text directing users to Code Server for implementation */
  codeServerHint: string;

  /** System prompt for Letta agent */
  systemPrompt: string;

  /** Matrix room address for chat */
  matrixRoom: string;

  /** Workspace files configuration */
  workspace: {
    /** README file name */
    readme: string;
    /** System prompt file name */
    systemPrompt: string;
    /** Additional example/documentation files */
    files: string[];
  };
}

/**
 * Runtime agent data from Letta API
 */
export interface LettaAgent {
  /** Letta agent ID (UUID) */
  id: string;

  /** Agent name */
  name: string;

  /** Agent description */
  description?: string;

  /** System prompt/persona */
  system?: string;

  /** Agent metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  created_at?: string;

  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Agent provisioning request
 */
export interface ProvisionAgentRequest {
  /** Agent configuration */
  config: AgentConfig;

  /** Force re-provision even if agent exists */
  force?: boolean;
}

/**
 * Agent provisioning result
 */
export interface ProvisionAgentResult {
  /** Whether provisioning succeeded */
  success: boolean;

  /** Letta agent data */
  agent?: LettaAgent;

  /** Error message if failed */
  error?: string;

  /** Whether agent was created (true) or already existed (false) */
  created: boolean;
}
