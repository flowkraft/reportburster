"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Eye, EyeOff, RefreshCw, Loader2, Search, Lock, Download, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PROVIDER_CONFIGS,
  getProviderDef,
  type LLMFullConfig,
  type ProviderSettings,
  type ProviderDef,
} from "@/lib/llm-providers";
import { toast } from "sonner";

interface LLMProviderFormProps {
  fullConfig: LLMFullConfig;
  onSave: (fullConfig: LLMFullConfig) => Promise<void>;
}

interface FetchedModel {
  id: string;
  name: string;
}

export function LLMProviderForm({ fullConfig, onSave }: LLMProviderFormProps) {
  // Form state — initialized from the active provider's stored settings
  const activeSettings = fullConfig.providers[fullConfig.activeProviderId];
  const [providerId, setProviderId] = useState(fullConfig.activeProviderId);
  const [apiKey, setApiKey] = useState(activeSettings?.apiKey || "");
  const [model, setModel] = useState(activeSettings?.model || "");
  const [baseUrl, setBaseUrl] = useState(activeSettings?.baseUrl || "");

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Ollama pull state
  const [pullModelName, setPullModelName] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullStatus, setPullStatus] = useState("");

  // Snapshot of fullConfig for dirty tracking
  const [savedFullConfig, setSavedFullConfig] = useState<LLMFullConfig>(fullConfig);

  const providerDef = getProviderDef(providerId);

  // Check if form is dirty by comparing against the saved config for the current provider
  const isProviderChanged = providerId !== savedFullConfig.activeProviderId;
  const isDirty = useMemo(() => {
    const savedSettings = savedFullConfig.providers[providerId];
    const savedApiKey = savedSettings?.apiKey || "";
    const savedModel = savedSettings?.model || "";
    const savedBaseUrl = savedSettings?.baseUrl || "";

    return (
      isProviderChanged ||
      apiKey !== savedApiKey ||
      model !== savedModel ||
      baseUrl !== savedBaseUrl
    );
  }, [providerId, apiKey, model, baseUrl, savedFullConfig, isProviderChanged]);

  // Sync with prop changes (e.g. when dialog reopens with fresh data)
  useEffect(() => {
    const settings = fullConfig.providers[fullConfig.activeProviderId];
    setProviderId(fullConfig.activeProviderId);
    setApiKey(settings?.apiKey || "");
    setModel(settings?.model || "");
    setBaseUrl(settings?.baseUrl || "");
    setSavedFullConfig(fullConfig);
    setFetchedModels([]);
    setModelSearch("");
  }, [fullConfig]);

  // When provider changes: load stored settings for that provider (if any)
  const handleProviderChange = (newProviderId: string) => {
    setProviderId(newProviderId);
    setFetchedModels([]);
    setModelSearch("");
    setShowModelDropdown(false);

    // Load stored settings for this provider
    const stored = savedFullConfig.providers[newProviderId];
    if (stored) {
      setApiKey(stored.apiKey || "");
      setModel(stored.model || "");
      setBaseUrl(stored.baseUrl || "");
    } else {
      // No stored config — use provider defaults
      setApiKey("");
      setModel("");
      const def = getProviderDef(newProviderId);
      if (def?.baseUrl !== undefined) {
        setBaseUrl(def.baseUrl);
      } else {
        setBaseUrl("");
      }
    }
  };

  // Fetch models from the server-side proxy
  const handleFetchModels = async () => {
    if (providerDef?.requiresApiKey !== false && !apiKey.trim()) {
      toast.error("Please enter your API key first");
      return;
    }

    setFetchingModels(true);
    try {
      const params = new URLSearchParams({ provider: providerId });
      if (apiKey.trim()) params.set("apiKey", apiKey);
      if (baseUrl.trim()) params.set("baseUrl", baseUrl);
      const res = await fetch(`/api/llm/models?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.models?.length > 0) {
        setFetchedModels(data.models);
        toast.success(`Fetched ${data.models.length} models`);
      } else if (data.success && data.models?.length === 0) {
        toast.info("No models found for this API key");
        setFetchedModels([]);
      } else {
        toast.error(data.error || "Failed to fetch models");
        setFetchedModels([]);
      }
    } catch (error) {
      toast.error("Failed to fetch models — you can type the model ID manually");
      setFetchedModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  // Pull (download) a model from Ollama registry
  const handlePullModel = async () => {
    const name = pullModelName.trim();
    if (!name) {
      toast.error("Enter a model name to pull");
      return;
    }

    setPulling(true);
    setPullProgress(0);
    setPullStatus("Starting download...");

    try {
      const res = await fetch("/api/llm/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: name, baseUrl: baseUrl.trim() || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || `Failed to pull model: ${res.statusText}`);
        setPulling(false);
        setPullStatus("");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.status === "success") {
              setPullProgress(100);
              setPullStatus("Download complete!");
              toast.success(`Model "${name}" pulled successfully`);
              // Auto-refresh local models and select the pulled model
              setModel(name);
              setPullModelName("");
              await handleFetchModels();
            } else if (event.status === "error") {
              toast.error(event.message || "Pull failed");
              setPullStatus(`Error: ${event.message || "Unknown error"}`);
            } else if (event.status === "pulling") {
              setPullProgress(event.progress || 0);
              setPullStatus(event.detail || "Downloading...");
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to Ollama");
      setPullStatus("");
    } finally {
      setPulling(false);
    }
  };

  // Filter fetched models by search term
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return fetchedModels;
    const q = modelSearch.toLowerCase();
    return fetchedModels.filter(
      (m) =>
        m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [fetchedModels, modelSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node) &&
        modelInputRef.current &&
        !modelInputRef.current.contains(e.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save handler — preserves other providers' stored configs
  const handleSave = async () => {
    setSaving(true);
    try {
      const currentSettings: ProviderSettings = {
        apiKey,
        model,
        baseUrl: providerDef?.showBaseUrl ? baseUrl : "",
      };

      const newFullConfig: LLMFullConfig = {
        activeProviderId: providerId,
        providers: {
          ...savedFullConfig.providers,
          [providerId]: currentSettings,
        },
      };

      await onSave(newFullConfig);
      setSavedFullConfig(newFullConfig);
      toast.success("API Provider settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Select a model from the dropdown
  const selectModel = (m: FetchedModel) => {
    setModel(m.id);
    setModelSearch("");
    setShowModelDropdown(false);
  };

  // Shared input class names
  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rb-cyan focus:border-transparent";
  const labelCls =
    "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  // Render the provider <select> with optgroup
  const renderProviderSelect = () => {
    const natives = PROVIDER_CONFIGS.filter((p) => !p.group);
    const compatibles = PROVIDER_CONFIGS.filter((p) => p.group);

    return (
      <div>
        <label className={labelCls}>API Provider</label>
        <select
          value={providerId}
          onChange={(e) => handleProviderChange(e.target.value)}
          className={inputCls + " cursor-pointer"}
        >
          {natives.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <optgroup label="OpenAI Compatible">
            {compatibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  };

  // Render Base URL field (conditionally)
  const renderBaseUrl = () => {
    if (!providerDef?.showBaseUrl) return null;

    return (
      <div>
        <label className={labelCls}>Base URL</label>
        <div className="relative">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            readOnly={!providerDef.baseUrlEditable}
            placeholder="https://api.example.com/v1"
            className={`${inputCls} ${
              !providerDef.baseUrlEditable
                ? "bg-muted text-muted-foreground cursor-not-allowed pr-9"
                : ""
            }`}
          />
          {!providerDef.baseUrlEditable && (
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  };

  // Render API Key field
  const renderApiKey = () => (
    <div>
      <label className={labelCls}>API Key</label>
      <div className="relative">
        <input
          type={showApiKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className={`${inputCls} pr-10`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShowApiKey(!showApiKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          title={showApiKey ? "Hide API key" : "Show API key"}
        >
          {showApiKey ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  // Render Ollama-specific section: warning, library link, pull UI
  const renderOllamaSection = () => {
    if (providerId !== "ollama") return null;

    return (
      <>
        {/* Warning banner */}
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Local LLM Hardware Requirements</p>
              <p className="text-xs leading-relaxed">
                Running a capable local LLM to power useful AI agents requires a machine with
                hundreds of GBs of RAM — which you probably don&apos;t have!
                Smaller models will produce poor or completely unusable results.
                Are you sure you know what you are doing?
              </p>
              <p className="text-xs leading-relaxed mt-1.5">
                We suggest models like <strong>glm-5</strong>, <strong>minimax-m2.5</strong>, or <strong>kimi-k2.5</strong>.
              </p>
              <a
                href="https://ollama.com/library?sort=newest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
              >
                Browse available models at ollama.com/library
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Pull model section */}
        <div>
          <label className={labelCls}>Pull a New Model</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pullModelName}
              onChange={(e) => setPullModelName(e.target.value)}
              placeholder="e.g. llama3:latest"
              className={inputCls}
              disabled={pulling}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !pulling && pullModelName.trim()) {
                  e.preventDefault();
                  handlePullModel();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePullModel}
              disabled={pulling || !pullModelName.trim()}
              className="shrink-0 h-[38px] px-3"
              title="Download model from Ollama registry"
            >
              {pulling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="ml-1.5">{pulling ? "Pulling..." : "Pull"}</span>
            </Button>
          </div>

          {/* Progress bar */}
          {(pulling || pullStatus) && (
            <div className="mt-2">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-rb-cyan transition-all duration-300 rounded-full"
                  style={{ width: `${pullProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {pullStatus}
                {pulling && pullProgress > 0 && ` (${pullProgress}%)`}
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

  // Render Model field — either searchable lookup or free text
  const renderModelField = () => {
    if (providerDef?.modelInputType === "text") {
      // Free text input for "Other"
      return (
        <div>
          <label className={labelCls}>Model ID</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. llama3.1:70b"
            className={inputCls}
          />
        </div>
      );
    }

    // Searchable lookup for all other providers
    return (
      <div>
        <label className={labelCls}>
          {providerId === "ollama" ? "Select Model (already downloaded)" : "Model"}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={modelInputRef}
              type="text"
              value={showModelDropdown ? modelSearch : model}
              onChange={(e) => {
                setModelSearch(e.target.value);
                if (!showModelDropdown && fetchedModels.length > 0) {
                  setShowModelDropdown(true);
                }
              }}
              onFocus={() => {
                if (fetchedModels.length > 0) {
                  setShowModelDropdown(true);
                  setModelSearch("");
                }
              }}
              placeholder={
                fetchedModels.length > 0
                  ? "Search models..."
                  : "Click 'Fetch Models' or type model ID"
              }
              className={`${inputCls} ${
                fetchedModels.length > 0 ? "pr-8" : ""
              }`}
            />
            {fetchedModels.length > 0 && (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            )}

            {/* Dropdown list */}
            {showModelDropdown && fetchedModels.length > 0 && (
              <div
                ref={modelDropdownRef}
                className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-lg"
              >
                {filteredModels.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No models match &quot;{modelSearch}&quot;
                  </div>
                ) : (
                  filteredModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectModel(m)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        m.id === model
                          ? "bg-rb-cyan/10 text-rb-cyan font-medium"
                          : "text-foreground"
                      }`}
                    >
                      <div className="truncate">
                        {m.name !== m.id ? (
                          <>
                            <span>{m.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {m.id}
                            </span>
                          </>
                        ) : (
                          <span>{m.id}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Fetch Models button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchModels}
            disabled={fetchingModels || (providerDef?.requiresApiKey !== false && !apiKey.trim())}
            className="shrink-0 h-[38px] px-3"
            title={
              providerDef?.requiresApiKey !== false && !apiKey.trim()
                ? "Enter API key first"
                : "Fetch available models from provider"
            }
          >
            {fetchingModels ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">
              {fetchingModels ? "Fetching..." : "Fetch Models"}
            </span>
          </Button>
        </div>

        {/* Show selected model below when dropdown is open */}
        {model && showModelDropdown && (
          <p className="text-xs text-muted-foreground mt-1">
            Selected: <span className="font-medium text-foreground">{model}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderProviderSelect()}

      {/* Provider-change restart note */}
      {isProviderChanged && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-3 py-2">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Switching providers requires a restart to apply new API keys.
              After saving, stop and start your FlowKraft&apos;s AI Hub application again before provisioning agents.
            </p>
          </div>
        </div>
      )}

      {renderBaseUrl()}
      {providerDef?.requiresApiKey !== false && renderApiKey()}
      {renderOllamaSection()}
      {renderModelField()}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="bg-rb-cyan hover:bg-rb-cyan/90 text-white disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
