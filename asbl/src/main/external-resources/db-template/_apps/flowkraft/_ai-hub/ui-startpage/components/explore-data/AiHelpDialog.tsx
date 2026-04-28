"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Sparkles, Copy, Check, Loader2, ExternalLink, ListPlus } from "lucide-react";
import type { SchemaInfo } from "@/lib/explore-data/types";
import { buildAiPrompt, type AiMode, type AiKind } from "@/lib/explore-data/ai-prompt-builder";
import { fetchCopilotUrl } from "@/lib/explore-data/rb-api";
import { SchemaBrowser } from "./SchemaBrowser";

export interface AiHelpDialogProps {
  open: boolean;
  onClose: () => void;
  mode: AiMode;
  kind: AiKind;
  connectionType: string;
  tableName?: string;
  cubeId?: string;
  schema?: SchemaInfo;
}

export function AiHelpDialog({
  open,
  onClose,
  mode,
  kind,
  connectionType,
  tableName,
  cubeId,
  schema,
}: AiHelpDialogProps) {
  const [requirement, setRequirement] = useState("");
  const [prompt, setPrompt] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copilotUrl, setCopilotUrl] = useState("https://chatgpt.com/");

  // ── "Pick more tables" state ──
  const [additionalTableNames, setAdditionalTableNames] = useState<string[]>([]);
  const [showTablePicker, setShowTablePicker] = useState(false);

  useEffect(() => {
    fetchCopilotUrl().then(setCopilotUrl);
  }, []);

  // Clear state when mode changes — this component is not unmounted on close
  // (just hidden via `if (!open) return null`), so without this reset the
  // requirement + prompt from a previous SQL session would persist when the
  // dialog reopens in Script mode (and vice versa).
  useEffect(() => {
    setRequirement("");
    setPrompt("");
    setError(null);
  }, [mode]);

  // Build the context label showing all selected tables
  const allTableNames = [tableName, ...additionalTableNames].filter(Boolean) as string[];
  const modeLabel = mode === "sql" ? "SQL" : "Script";

  // Context label: show all table names, with truncation + tooltip if >2
  let contextDisplay: string;
  let contextTooltip: string | undefined;
  if (kind === "cube") {
    contextDisplay = cubeId || "cube";
  } else if (allTableNames.length === 0) {
    contextDisplay = "table";
  } else if (allTableNames.length <= 2) {
    contextDisplay = allTableNames.join(", ");
  } else {
    contextDisplay = allTableNames.slice(0, 2).join(", ") + ", …";
    contextTooltip = allTableNames.join(", ");
  }

  const handleBuild = useCallback(async () => {
    setBuilding(true);
    setError(null);
    try {
      const result = await buildAiPrompt({
        mode,
        kind,
        requirement,
        connectionType,
        schema,
        tableName,
        cubeId,
        additionalTableNames,
      });
      setPrompt(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build prompt");
    } finally {
      setBuilding(false);
    }
  }, [mode, kind, requirement, connectionType, schema, tableName, cubeId, additionalTableNames]);

  // Auto-rebuild prompt when requirement or tables change (Phase 2 only)
  useEffect(() => {
    // Only auto-build after the user has explicitly built once (Phase 2)
    if (!prompt || !requirement.trim()) return;

    const timer = setTimeout(() => {
      setBuilding(true);
      setError(null);
      buildAiPrompt({
        mode,
        kind,
        requirement,
        connectionType,
        schema,
        tableName,
        cubeId,
        additionalTableNames,
      })
        .then((result) => setPrompt(result))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to build prompt"))
        .finally(() => setBuilding(false));
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement, additionalTableNames]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-sm text-foreground">AI Prompt Builder</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context bar */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border shrink-0 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            Using:{" "}
            <span
              className="text-foreground font-medium"
              title={contextTooltip}
            >
              {contextDisplay}
            </span>
            {connectionType && (
              <>
                {" · "}
                <span className="text-foreground font-medium">{connectionType}</span>
              </>
            )}
            {" · "}Mode:{" "}
            <span className="text-foreground font-medium">
              {modeLabel} from {kind}
            </span>
          </p>
          {/* "Pick more tables" — only for table kind (SQL from table / Script from table) */}
          {kind === "table" && (
            <button
              type="button"
              onClick={() => setShowTablePicker(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors shrink-0"
              title="Pick additional tables to include in the AI prompt context"
            >
              <ListPlus className="w-3 h-3" />
              Pick more tables
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">What do you need?</label>
            <textarea
              id="txtAiRequirement"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={`Describe what ${modeLabel.toLowerCase()} you want — e.g. "Show monthly revenue by region, top 10 customers only"`}
              rows={3}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {!prompt && (
            <button
              id="btnBuildPrompt"
              onClick={handleBuild}
              disabled={!requirement.trim() || building}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {building ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {building ? "Building…" : "Build Prompt"}
            </button>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </div>
          )}

          {prompt && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ready-to-copy prompt</label>
              <textarea
                readOnly
                value={prompt}
                rows={12}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full text-xs font-mono bg-muted/30 border border-border rounded-md px-3 py-2 text-foreground resize-none focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 p-4 border-t border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            Paste into{" "}
            <a
              href={copilotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              AI Assistant
            </a>
            {" "}→ get {modeLabel} back → paste into editor
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {prompt && (
              <button
                id="btnCopyToClipboard"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            )}
            <button
              id="btnCloseAiHelp"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
            >
              Close
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* ── Table Picker Modal Overlay ── */}
      {showTablePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-background border border-border rounded-xl shadow-xl max-h-[75vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
              <span className="font-semibold text-sm text-foreground">Pick Tables</span>
              <button
                onClick={() => setShowTablePicker(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SchemaBrowser
              mode="ai-prompt"
              preselectedTableNames={allTableNames}
              preselectedCubeIds={cubeId ? [cubeId] : []}
              onPick={({ tableNames }) => {
                // Remove the primary tableName from additional — it's always included
                setAdditionalTableNames(tableNames.filter((n) => n !== tableName));
                setShowTablePicker(false);
              }}
              onClose={() => setShowTablePicker(false)}
              pickButtonLabel="Pick Tables"
            />
          </div>
        </div>
      )}
    </div>
  );
}
