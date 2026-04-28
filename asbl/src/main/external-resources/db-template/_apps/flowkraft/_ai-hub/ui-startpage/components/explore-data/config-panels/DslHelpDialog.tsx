"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Sparkles, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { buildDslAiPrompt } from "@/lib/explore-data/ai-prompt-builder";
import { fetchCopilotUrl } from "@/lib/explore-data/rb-api";

const DIALOG_TITLES: Record<string, string> = {
  tabulator:     "Hey AI, Help Me Configure This Tabulator Table\u2026",
  chart:         "Hey AI, Help Me Configure This Chart\u2026",
  pivot:         "Hey AI, Help Me Configure This Pivot Table\u2026",
  "filter-pane": "Hey AI, Help Me Configure This Filter Pane\u2026",
  "filter-bar":  "Hey AI, Help Me Configure Dashboard Filters\u2026",
};

export interface DslHelpDialogProps {
  open: boolean;
  onClose: () => void;
  componentType: string;
  currentDsl: string;
  columns: ColumnSchema[];
  sampleData: Record<string, unknown>[];
}

export function DslHelpDialog({
  open,
  onClose,
  componentType,
  currentDsl,
  columns,
  sampleData,
}: DslHelpDialogProps) {
  const [requirement, setRequirement] = useState("");
  const [prompt, setPrompt] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiUrl, setAiUrl] = useState<string | null>(null);

  const title = DIALOG_TITLES[componentType] ?? `Hey AI, Help Me Configure This ${componentType}\u2026`;

  // Load the AI target URL from RB settings (cached singleton in rb-api.ts).
  useEffect(() => {
    if (!open) return;
    fetchCopilotUrl().then((url) => {
      if (url && url !== "https://chatgpt.com/") setAiUrl(url);
      else setAiUrl(url); // always set so we always show a link
    });
  }, [open]);

  const handleBuild = useCallback(async () => {
    setBuilding(true);
    setError(null);
    try {
      const result = await buildDslAiPrompt({
        componentType,
        requirement,
        columns,
        sampleData,
        currentDsl,
      });
      setPrompt(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build prompt");
    } finally {
      setBuilding(false);
    }
  }, [componentType, requirement, columns, sampleData, currentDsl]);

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
            <span className="font-semibold text-sm text-foreground">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">What do you need?</label>
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={`Describe how you want to configure this — e.g. "Show country column with search filter, sort alphabetically, highlight rows where value > 1000"`}
              rows={3}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            onClick={handleBuild}
            disabled={!requirement.trim() || building}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {building ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {building ? "Building\u2026" : "Build Prompt"}
          </button>

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
                rows={14}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full text-xs font-mono bg-muted/30 border border-border rounded-md px-3 py-2 text-foreground resize-none focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border shrink-0 gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">
              Paste into ChatGPT / Claude / any AI → get DSL back → paste into editor
            </p>
            {aiUrl && (
              <a
                href={aiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                {aiUrl}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {prompt && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
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
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
