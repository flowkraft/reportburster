import * as path from 'path';

export type MemoryBlockDef = {
  label: string;
  description?: string;
  value?: string;
  limit?: number;
};

export type ToolDef = {
  name: string;
  endpoint?: string;
  description?: string;
};

export type AgentConfig = {
  key: string; // local stable key
  displayName: string;
  description: string;
  model: string;
  tags?: string[];
  systemPrompt?: string;
  memoryBlocks?: MemoryBlockDef[];
  tools?: ToolDef[];
  options?: {
    maxSteps?: number;
    background?: boolean;
    timeoutInSeconds?: number;
    enableSleeptime?: boolean;
  };
  // Optional embedding model handle (required for self-hosted Letta)
  embedding?: string;
  // Optional override chat URL (when set, used as chat link target)
  chatUrl?: string;
};

export const AGENTS_DIR = path.join(process.cwd(), 'src', 'agents');
