import type { AgentConfig } from './common';
import { AGENTS as AGENTS_STORE, AGENTS_CHAT_URL as AGENTS_CHAT_URL_STORE } from './agents-registry';

/**
 * Static list of agent configs. Prefer adding agents explicitly in
 * `agents-registry.ts` rather than scanning the filesystem at runtime.
 */
export const AGENTS: AgentConfig[] = AGENTS_STORE;
export const AGENTS_CHAT_URL = AGENTS_CHAT_URL_STORE;
