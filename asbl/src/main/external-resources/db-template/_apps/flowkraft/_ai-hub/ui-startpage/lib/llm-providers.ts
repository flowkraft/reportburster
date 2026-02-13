/**
 * LLM Provider configuration registry.
 * Defines available providers, their API endpoints, and auth patterns.
 * Model lists are fetched dynamically — nothing is hardcoded here.
 */

// Flat config returned by getActiveProviderConfig()
export interface LLMProviderConfig {
  providerId: string
  apiKey: string
  model: string
  baseUrl?: string
}

// Per-provider settings stored in SQLite
export interface ProviderSettings {
  apiKey: string
  model: string
  baseUrl?: string
}

// Full config stored in SQLite under 'llm.provider'
export interface LLMFullConfig {
  activeProviderId: string
  providers: Record<string, ProviderSettings>
}

export interface ProviderDef {
  id: string
  name: string
  group?: string           // if set, rendered inside an <optgroup>
  baseUrl?: string         // pre-populated base URL (read-only for openrouter/zai)
  baseUrlEditable?: boolean // true only for "other"
  showBaseUrl: boolean     // whether to render the base URL field
  modelsEndpoint?: string  // full URL template for fetching models (server-side proxy)
  authStyle: 'bearer' | 'x-api-key' | 'query-param' | 'none'
  modelInputType: 'fetch' | 'text' // fetch = searchable lookup, text = free input
  requiresApiKey?: boolean // default true; false for Ollama (no auth needed)
}

// Top-level native providers
const NATIVE_PROVIDERS: ProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    showBaseUrl: false,
    modelsEndpoint: 'https://api.openai.com/v1/models',
    authStyle: 'bearer',
    modelInputType: 'fetch',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    showBaseUrl: false,
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    authStyle: 'x-api-key',
    modelInputType: 'fetch',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    showBaseUrl: false,
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    authStyle: 'query-param',
    modelInputType: 'fetch',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://flowkraft-ai-hub-ollama:11434',
    showBaseUrl: true,
    baseUrlEditable: true,
    authStyle: 'none',
    modelInputType: 'fetch',
    requiresApiKey: false,
  },
]

// OpenAI Compatible sub-options (rendered in an <optgroup>)
const COMPATIBLE_PROVIDERS: ProviderDef[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter.ai',
    group: 'OpenAI Compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    showBaseUrl: true,
    baseUrlEditable: false,
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    authStyle: 'bearer',
    modelInputType: 'fetch',
  },
  {
    id: 'zai',
    name: 'Z.ai',
    group: 'OpenAI Compatible',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    showBaseUrl: true,
    baseUrlEditable: false,
    modelsEndpoint: 'https://api.z.ai/api/coding/paas/v4/models',
    authStyle: 'bearer',
    modelInputType: 'fetch',
  },
  {
    id: 'other',
    name: 'Other',
    group: 'OpenAI Compatible',
    baseUrl: '',
    showBaseUrl: true,
    baseUrlEditable: true,
    authStyle: 'none',
    modelInputType: 'text',
  },
]

export const PROVIDER_CONFIGS: ProviderDef[] = [
  ...NATIVE_PROVIDERS,
  ...COMPATIBLE_PROVIDERS,
]

export function getProviderDef(providerId: string): ProviderDef | undefined {
  return PROVIDER_CONFIGS.find(p => p.id === providerId)
}

export const DEFAULT_LLM_FULL_CONFIG: LLMFullConfig = {
  activeProviderId: 'openai',
  providers: {},
}

/**
 * Extract the active provider's flat config from the full config.
 */
export function getActiveProviderConfig(full: LLMFullConfig): LLMProviderConfig {
  const settings = full.providers[full.activeProviderId] || { apiKey: '', model: '', baseUrl: '' }
  return {
    providerId: full.activeProviderId,
    apiKey: settings.apiKey,
    model: settings.model,
    baseUrl: settings.baseUrl || '',
  }
}
