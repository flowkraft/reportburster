import { NextResponse } from "next/server";

interface NormalizedModel {
  id: string;
  name: string;
}

/**
 * GET /api/llm/models?provider=openai&apiKey=sk-...
 *
 * Server-side proxy that fetches model lists from LLM providers.
 * Avoids browser CORS issues and keeps API keys off the client network tab.
 * Returns a normalized { success, models: [{ id, name }] } response.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const apiKey = searchParams.get("apiKey");

  const baseUrl = searchParams.get("baseUrl");

  if (!provider) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: provider" },
      { status: 400 }
    );
  }

  // API key is required for all providers except Ollama
  if (!apiKey && provider !== "ollama") {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: apiKey" },
      { status: 400 }
    );
  }

  try {
    const models = await fetchModelsForProvider(provider, apiKey || "", baseUrl);
    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    console.error(`Error fetching models for ${provider}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch models" },
      { status: 502 }
    );
  }
}

async function fetchModelsForProvider(
  provider: string,
  apiKey: string,
  baseUrl?: string | null
): Promise<NormalizedModel[]> {
  switch (provider) {
    case "openai":
      return fetchOpenAI(apiKey);
    case "anthropic":
      return fetchAnthropic(apiKey);
    case "google":
      return fetchGemini(apiKey);
    case "openrouter":
      return fetchOpenRouter(apiKey);
    case "zai":
      return fetchZai(apiKey, "https://api.z.ai/api/coding/paas/v4/models");
    case "zai-credits":
      return fetchZai(apiKey, "https://api.z.ai/api/paas/v4/models");
    case "ollama":
      return fetchOllama(baseUrl);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * OpenAI: GET https://api.openai.com/v1/models
 * Auth: Bearer token
 * Response: { data: [{ id, owned_by }] }
 */
async function fetchOpenAI(apiKey: string): Promise<NormalizedModel[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const models: NormalizedModel[] = (json.data || [])
    .map((m: any) => ({ id: m.id, name: m.id }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.id.localeCompare(b.id));

  return models;
}

/**
 * Anthropic: GET https://api.anthropic.com/v1/models
 * Auth: x-api-key header + anthropic-version header
 * Response: { data: [{ id, display_name }], has_more, first_id, last_id }
 * Paginated — we fetch up to 1000 models in one request (max limit).
 */
async function fetchAnthropic(apiKey: string): Promise<NormalizedModel[]> {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=1000", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const models: NormalizedModel[] = (json.data || [])
    .map((m: any) => ({
      id: m.id,
      name: m.display_name || m.id,
    }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.name.localeCompare(b.name));

  return models;
}

/**
 * Google Gemini: GET https://generativelanguage.googleapis.com/v1beta/models?key=KEY
 * Auth: query parameter
 * Response: { models: [{ name, displayName }] }
 */
async function fetchGemini(apiKey: string): Promise<NormalizedModel[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1000`
  );

  if (!res.ok) {
    throw new Error(`Google Gemini API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const models: NormalizedModel[] = (json.models || [])
    .map((m: any) => ({
      id: m.name, // e.g. "models/gemini-2.0-flash"
      name: m.displayName || m.name,
    }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.name.localeCompare(b.name));

  return models;
}

/**
 * OpenRouter: GET https://openrouter.ai/api/v1/models
 * Auth: Bearer token
 * Response: { data: [{ id, name }] }
 */
async function fetchOpenRouter(apiKey: string): Promise<NormalizedModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const models: NormalizedModel[] = (json.data || [])
    .map((m: any) => ({
      id: m.id, // e.g. "anthropic/claude-sonnet-4"
      name: m.name || m.id,
    }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.name.localeCompare(b.name));

  return models;
}

/**
 * Z.ai (Zhipu AI): GET https://api.z.ai/api/paas/v4/models
 * Auth: Bearer token
 * Note: This endpoint is undocumented but Z.ai claims OpenAI compatibility.
 * Falls back gracefully if it doesn't work.
 */
async function fetchZai(apiKey: string, modelsUrl: string): Promise<NormalizedModel[]> {
  const res = await fetch(modelsUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Z.ai API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  // Try OpenAI-compatible format first, then fallback
  const data = json.data || json.models || [];
  const models: NormalizedModel[] = data
    .map((m: any) => ({
      id: m.id || m.name,
      name: m.display_name || m.name || m.id,
    }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.name.localeCompare(b.name));

  return models;
}

/**
 * Ollama: GET http://<host>:11434/api/tags
 * Auth: none (local service)
 * Response: { models: [{ name, model, modified_at, size, ... }] }
 * Only lists models that have been pulled (downloaded) locally.
 */
async function fetchOllama(baseUrl?: string | null): Promise<NormalizedModel[]> {
  const ollamaUrl = baseUrl || process.env.OLLAMA_BASE_URL || "http://flowkraft-ai-hub-ollama:11434";
  const res = await fetch(`${ollamaUrl}/api/tags`);

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const models: NormalizedModel[] = (json.models || [])
    .map((m: any) => ({
      id: m.name,   // e.g. "llama3:latest"
      name: m.name, // e.g. "llama3:latest"
    }))
    .sort((a: NormalizedModel, b: NormalizedModel) => a.id.localeCompare(b.id));

  return models;
}
