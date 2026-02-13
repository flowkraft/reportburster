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
 */
export async function POST() {
  try {
    const aiHubDir = path.resolve(process.cwd(), "..");
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

    // Always start from the immutable template
    let content = fs.readFileSync(templatePath, "utf-8");

    // 1. Populate ALL stored providers' sections with their API keys
    //    Inactive providers stay commented (e.g., #GEMINI_API_KEY=AIza...)
    //    Active provider gets uncommented (e.g., OPENAI_API_KEY=sk-xxx)
    for (const [pid, settings] of Object.entries(fullConfig.providers)) {
      if (!settings.apiKey && pid !== "ollama") continue; // skip providers with no stored key
      const isActive = pid === fullConfig.activeProviderId;
      content = populateProviderSection(content, pid, settings.apiKey, settings.baseUrl, !isActive);
    }

    // 2. Update OLLAMA_BASE_URL if Ollama is active and user changed the URL
    if (active.providerId === "ollama" && active.baseUrl) {
      content = setEnvVar(content, /^OLLAMA_BASE_URL=.*/m, `OLLAMA_BASE_URL=${active.baseUrl}`);
    }

    // 3. Update LLM_MODEL_ID (with ollama/ prefix for Ollama provider)
    const effectiveModel =
      active.providerId === "ollama"
        ? active.model.startsWith("ollama/") ? active.model : `ollama/${active.model}`
        : active.model;
    content = setEnvVar(content, /^#?\s*LLM_MODEL_ID=.*/m, `LLM_MODEL_ID=${effectiveModel}`);

    fs.writeFileSync(envPath, content, "utf-8");

    // Sync to running process so provisioning picks up changes immediately
    syncProcessEnv(active.providerId, active.apiKey, effectiveModel, active.baseUrl);

    return NextResponse.json({
      success: true,
      provider: active.providerId,
      model: active.model,
    });
  } catch (error: any) {
    console.error("Error updating .env:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update .env" },
      { status: 500 }
    );
  }
}

// ── Section labels mapping ─────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  openai: "# --- OpenAI ---",
  anthropic: "# --- Anthropic ---",
  google: "# --- Google Gemini ---",
  ollama: "# --- Ollama (Local) ---",
  openrouter: "# --- OpenRouter.ai (OpenAI Compatible) ---",
  zai: "# --- Z.ai (OpenAI Compatible) ---",
  other: "# --- Other (OpenAI Compatible) ---",
};

const ENV_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  zai: "https://api.z.ai/api/coding/paas/v4",
};

const PROVIDER_VAR_PATTERNS = [
  /^#?\s*OPENAI_API_KEY=/,
  /^#?\s*OPENAI_API_BASE=/,
  /^#?\s*ANTHROPIC_API_KEY=/,
  /^#?\s*GEMINI_API_KEY=/,
];

function isProviderVarLine(line: string): boolean {
  const trimmed = line.trim();
  return PROVIDER_VAR_PATTERNS.some((p) => p.test(trimmed));
}

/**
 * Populate a provider's section with its stored API key.
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

    const prefix = commented ? "#" : "";

    if (providerId === "anthropic") {
      if (/ANTHROPIC_API_KEY=/.test(trimmed)) {
        lines[i] = `${prefix}ANTHROPIC_API_KEY=${apiKey}`;
      }
    } else if (providerId === "google") {
      if (/GEMINI_API_KEY=/.test(trimmed)) {
        lines[i] = `${prefix}GEMINI_API_KEY=${apiKey}`;
      }
    } else {
      // openai, openrouter, zai, other — all use OPENAI_API_KEY/BASE
      if (/OPENAI_API_KEY=/.test(trimmed)) {
        lines[i] = `${prefix}OPENAI_API_KEY=${apiKey}`;
      }
      if (/OPENAI_API_BASE=/.test(trimmed)) {
        const envBase = ENV_BASE_URLS[providerId] || baseUrl || "";
        lines[i] = `${prefix}OPENAI_API_BASE=${envBase}`;
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
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_BASE;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;

  switch (providerId) {
    case "anthropic":
      process.env.ANTHROPIC_API_KEY = apiKey;
      break;
    case "google":
      process.env.GEMINI_API_KEY = apiKey;
      break;
    case "ollama":
      if (baseUrl) process.env.OLLAMA_BASE_URL = baseUrl;
      break;
    default:
      process.env.OPENAI_API_KEY = apiKey;
      process.env.OPENAI_API_BASE = ENV_BASE_URLS[providerId] || baseUrl || "";
      break;
  }

  process.env.LLM_MODEL_ID = model;
}
