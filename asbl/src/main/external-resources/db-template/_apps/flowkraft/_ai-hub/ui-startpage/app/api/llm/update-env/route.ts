import { NextResponse } from "next/server";
import { getConfig } from "@/lib/db";
import { getActiveProviderConfig, type LLMFullConfig } from "@/lib/llm-providers";
import path from "path";
import fs from "fs";

/**
 * POST /api/llm/update-env
 *
 * Generates the _ai-hub/.env file from .env.example + the saved LLM provider config.
 * Called before agent provisioning so Letta picks up the correct API keys.
 *
 * Strategy: always read .env.example as the immutable template, populate ALL
 * stored providers' API keys (commented for inactive, uncommented for active),
 * and write .env. Idempotent and self-healing.
 *
 * Each provider uses its native Letta env var (e.g., ZAI_API_KEY for Z.ai,
 * OPENROUTER_API_KEY for OpenRouter) so Letta activates the correct native
 * provider and generates the right model handle prefix.
 */
export async function POST() {
  try {
    const aiHubDir = "/ai-hub";
    const templatePath = path.join(aiHubDir, ".env.example");
    const envPath = path.join(aiHubDir, ".env");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { success: false, error: `.env.example not found at ${templatePath}` },
        { status: 404 }
      );
    }

    // Read saved LLM provider config from SQLite
    const raw = getConfig("llm.provider");
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "No LLM provider configured yet" },
        { status: 400 }
      );
    }

    const fullConfig = JSON.parse(raw) as LLMFullConfig;
    const active = getActiveProviderConfig(fullConfig);

    if (active.providerId !== "ollama" && !active.apiKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured" },
        { status: 400 }
      );
    }

    // Detect provider change by reading the existing .env (if any)
    let previousProvider = "";
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, "utf-8");
      const m = existing.match(/^LLM_MODEL_ID=(\S+)/m);
      if (m) previousProvider = m[1].split("/")[0]; // e.g., "zai" from "zai/glm-5"
    }

    // Always start from the immutable template
    let content = fs.readFileSync(templatePath, "utf-8");

    // 1. Populate ALL stored providers' sections with their API keys
    //    Inactive providers stay commented (e.g., #GEMINI_API_KEY=AIza...)
    //    Active provider gets uncommented (e.g., ZAI_API_KEY=sk-xxx)
    for (const [pid, settings] of Object.entries(fullConfig.providers)) {
      if (!settings.apiKey && pid !== "ollama") continue;
      const isActive = pid === fullConfig.activeProviderId;
      // Skip inactive providers that share the same .env section as the active one
      // (e.g., "zai" and "other" both map to "# --- Other (OpenAI Compatible) ---")
      if (!isActive && SECTION_LABELS[pid] === SECTION_LABELS[fullConfig.activeProviderId]) continue;
      content = populateProviderSection(content, pid, settings.apiKey, settings.baseUrl, !isActive);
    }

    // 2. Update OLLAMA_BASE_URL if Ollama is active and user changed the URL
    if (active.providerId === "ollama" && active.baseUrl) {
      content = setEnvVar(content, /^OLLAMA_BASE_URL=.*/m, `OLLAMA_BASE_URL=${active.baseUrl}`);
    }

    // 3. Prefix the model with the Letta provider handle.
    //    Each native provider uses its own prefix (e.g., zai/glm-5, openrouter/model).
    //    "other" routes through OPENAI_API_BASE → Letta 0.16.4 uses "openai-proxy/" prefix.
    const prefix = LETTA_PREFIX[active.providerId] ?? "openai";
    const effectiveModel = active.model.startsWith(`${prefix}/`)
      ? active.model
      : `${prefix}/${active.model}`;
    content = setEnvVar(content, /^#?\s*LLM_MODEL_ID=.*/m, `LLM_MODEL_ID=${effectiveModel}`);

    fs.writeFileSync(envPath, content, "utf-8");

    // Sync to running process so provisioning picks up changes immediately
    syncProcessEnv(active.providerId, active.apiKey, effectiveModel, active.baseUrl);

    const newProvider = prefix;
    const providerChanged = previousProvider !== "" && previousProvider !== newProvider;

    return NextResponse.json({
      success: true,
      provider: active.providerId,
      model: active.model,
      providerChanged,
    });
  } catch (error: any) {
    console.error("Error updating .env:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update .env" },
      { status: 500 }
    );
  }
}

// ── Section labels — must match .env.example headers exactly ──────
const SECTION_LABELS: Record<string, string> = {
  openai: "# --- OpenAI ---",
  anthropic: "# --- Anthropic ---",
  google: "# --- Google Gemini ---",
  zai: "# --- Other (OpenAI Compatible) ---",       // Coding Plan → routes through Other section
  "zai-credits": "# --- Z.ai ---",                  // API Credits → native Z.ai section
  openrouter: "# --- OpenRouter.ai ---",
  other: "# --- Other (OpenAI Compatible) ---",
  ollama: "# --- Ollama (Local) ---",
};

// ── Letta model handle prefixes (one per native provider) ─────────
// Letta 0.16.4: each provider registers models as "{provider_type}/{model}".
// "other" uses OPENAI_API_BASE with custom URL → Letta generates "openai-proxy/".
const LETTA_PREFIX: Record<string, string> = {
  openai:         "openai",
  anthropic:      "anthropic",
  google:         "google_ai",      // Letta enum is "google_ai", not "google"
  ollama:         "ollama",
  zai:            "openai-proxy",   // Coding Plan → OPENAI_API_BASE route
  "zai-credits":  "zai",            // API Credits → native ZAI provider
  openrouter:     "openrouter",     // native OpenRouter provider
  other:          "openai-proxy",   // custom OPENAI_API_BASE in Letta 0.16.4
};

// ── Env var patterns that can appear in provider sections ─────────
const PROVIDER_VAR_PATTERNS = [
  /^#?\s*OPENAI_API_KEY=/,
  /^#?\s*OPENAI_API_BASE=/,
  /^#?\s*ANTHROPIC_API_KEY=/,
  /^#?\s*GEMINI_API_KEY=/,
  /^#?\s*ZAI_API_KEY=/,
  /^#?\s*OPENROUTER_API_KEY=/,
];

function isProviderVarLine(line: string): boolean {
  const trimmed = line.trim();
  return PROVIDER_VAR_PATTERNS.some((p) => p.test(trimmed));
}

/**
 * Populate a provider's section with its stored API key.
 * Each provider writes its own native env var (e.g., ZAI_API_KEY for Z.ai).
 *
 * @param commented - true for inactive providers (lines stay prefixed with #),
 *                    false for the active provider (lines are uncommented)
 */
function populateProviderSection(
  content: string,
  providerId: string,
  apiKey: string,
  baseUrl?: string,
  commented: boolean = false,
): string {
  const sectionLabel = SECTION_LABELS[providerId];
  if (!sectionLabel) return content;

  const lines = content.split("\n");
  const sectionStart = lines.findIndex((l) => l.trim() === sectionLabel);
  if (sectionStart === -1) return content;

  for (let i = sectionStart + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed.startsWith("# ---") || (trimmed !== "" && !isProviderVarLine(lines[i]) && !trimmed.startsWith("#"))) {
      break;
    }

    if (!isProviderVarLine(lines[i])) continue;

    const pfx = commented ? "#" : "";

    if (providerId === "anthropic") {
      if (/ANTHROPIC_API_KEY=/.test(trimmed)) {
        lines[i] = `${pfx}ANTHROPIC_API_KEY=${apiKey}`;
      }
    } else if (providerId === "google") {
      if (/GEMINI_API_KEY=/.test(trimmed)) {
        lines[i] = `${pfx}GEMINI_API_KEY=${apiKey}`;
      }
    } else if (providerId === "zai-credits") {
      if (/ZAI_API_KEY=/.test(trimmed)) {
        lines[i] = `${pfx}ZAI_API_KEY=${apiKey}`;
      }
    } else if (providerId === "openrouter") {
      if (/OPENROUTER_API_KEY=/.test(trimmed)) {
        lines[i] = `${pfx}OPENROUTER_API_KEY=${apiKey}`;
      }
    } else {
      // openai, other — use OPENAI_API_KEY/BASE
      if (/OPENAI_API_KEY=/.test(trimmed)) {
        lines[i] = `${pfx}OPENAI_API_KEY=${apiKey}`;
      }
      if (/OPENAI_API_BASE=/.test(trimmed)) {
        lines[i] = `${pfx}OPENAI_API_BASE=${baseUrl || ""}`;
      }
    }
  }

  return lines.join("\n");
}

/**
 * Set an env var line matching a pattern. If not found, append it.
 */
function setEnvVar(content: string, pattern: RegExp, replacement: string): string {
  if (pattern.test(content)) {
    return content.replace(pattern, replacement);
  }
  return content + `\n${replacement}\n`;
}

/**
 * Sync provider env vars to the running Node.js process.
 */
function syncProcessEnv(
  providerId: string,
  apiKey: string,
  model: string,
  baseUrl?: string
) {
  // Clear all provider keys first
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_BASE;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ZAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  switch (providerId) {
    case "anthropic":
      process.env.ANTHROPIC_API_KEY = apiKey;
      break;
    case "google":
      process.env.GEMINI_API_KEY = apiKey;
      break;
    case "zai":
      // Coding Plan → routes through OPENAI_API_BASE (coding endpoint)
      process.env.OPENAI_API_KEY = apiKey;
      process.env.OPENAI_API_BASE = baseUrl || "https://api.z.ai/api/coding/paas/v4";
      break;
    case "zai-credits":
      // API Credits → native ZAI provider
      process.env.ZAI_API_KEY = apiKey;
      break;
    case "openrouter":
      process.env.OPENROUTER_API_KEY = apiKey;
      break;
    case "ollama":
      if (baseUrl) process.env.OLLAMA_BASE_URL = baseUrl;
      break;
    case "other":
      process.env.OPENAI_API_KEY = apiKey;
      process.env.OPENAI_API_BASE = baseUrl || "";
      break;
    default:
      // openai
      process.env.OPENAI_API_KEY = apiKey;
      break;
  }

  process.env.LLM_MODEL_ID = model;
}
