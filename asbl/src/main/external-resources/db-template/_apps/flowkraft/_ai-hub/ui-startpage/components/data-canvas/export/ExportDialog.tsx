"use client";

import { useState, useMemo } from "react";
import { X, Download, Check, ExternalLink, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { generateExport, type ExportedFiles } from "./exportGenerator";
import { saveDashboardToReportBurster } from "./rbApiClient";

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:8123/api";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const state = useCanvasStore();
  const [reportCode, setReportCode] = useState(() => slugify(state.name));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; dashboardUrl?: string; error?: string } | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const files = useMemo<ExportedFiles | null>(() => {
    if (!open) return null;
    return generateExport(
      { widgets: state.widgets, filters: state.filters },
      reportCode,
      RB_BASE.replace("/api", "")
    );
  }, [open, state.id, state.name, state.description, state.connectionId, state.widgets, state.filters, reportCode]);

  const handleSave = async () => {
    if (!files || !state.connectionId) return;
    setSaving(true);
    setResult(null);
    const res = await saveDashboardToReportBurster(files, state.connectionId);
    setResult(res);
    setSaving(false);
  };

  if (!open) return null;

  const fileList = files ? [
    { name: `${reportCode}-template.html`, content: files.templateHtml, label: "HTML Template" },
    { name: `${reportCode}-script.groovy`, content: files.scriptGroovy, label: "Data Script" },
    { name: `${reportCode}-chart-config.groovy`, content: files.chartConfigGroovy, label: "Chart Config" },
    { name: `${reportCode}-tabulator-config.groovy`, content: files.tabulatorConfigGroovy, label: "Tabulator Config" },
    { name: `${reportCode}-pivot-config.groovy`, content: files.pivotConfigGroovy, label: "Pivot Config" },
    { name: `${reportCode}-report-parameters-spec.groovy`, content: files.parametersSpecGroovy, label: "Parameters" },
  ].filter((f) => f.content) : [];

  const hasWidgets = state.widgets.some((w) => ["chart", "tabulator", "pivot", "kpi"].includes(w.type));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Save Dashboard to ReportBurster</h2>
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Dashboard name / report code */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Dashboard ID</label>
              <input
                value={reportCode}
                onChange={(e) => { setReportCode(slugify(e.target.value)); setResult(null); }}
                className="w-full mt-1 text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground"
                placeholder="my-dashboard"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Saved to <code className="text-[10px] px-1 py-0.5 bg-muted rounded">config/reports/{reportCode}/</code>
              </p>
            </div>

            {/* Connection */}
            {!state.connectionId && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                Select a database connection first (in any widget's Data tab)
              </div>
            )}

            {/* Validation */}
            {!hasWidgets && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                Add at least one data widget (chart, table, pivot, or KPI) to the canvas
              </div>
            )}

            {/* File preview */}
            {fileList.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Generated files ({fileList.length})</label>
                <div className="mt-1 border border-border rounded-md divide-y divide-border">
                  {fileList.map((f) => (
                    <div key={f.name}>
                      <button
                        onClick={() => setExpandedFile(expandedFile === f.name ? null : f.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted/30 transition-colors"
                      >
                        {expandedFile === f.name ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span className="font-mono text-[11px]">{f.name}</span>
                        <span className="ml-auto text-muted-foreground">{f.label}</span>
                      </button>
                      {expandedFile === f.name && (
                        <pre className="px-3 pb-3 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {f.content}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {result && result.success && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                <Check className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-medium">Dashboard saved successfully!</p>
                  <a
                    href={result.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-emerald-700 underline"
                  >
                    View dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {result && !result.success && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                {result.error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !state.connectionId || !hasWidgets || !reportCode}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
              ) : result?.success ? (
                <><Download className="w-3.5 h-3.5" />Update Dashboard in ReportBurster</>
              ) : (
                <><Download className="w-3.5 h-3.5" />Save Dashboard to ReportBurster</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
