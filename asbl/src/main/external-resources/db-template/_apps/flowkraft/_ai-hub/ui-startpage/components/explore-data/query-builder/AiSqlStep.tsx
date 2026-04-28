"use client";

import { useState } from "react";
import { Sparkles, Loader2, Play } from "lucide-react";
import type { DataSource } from "@/lib/stores/canvas-store";

interface AiSqlStepProps {
  canvasId: string;
  schemaContext: string;
  connectionType: string;
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
  onRun: (sql: string) => void;
}

export function AiSqlStep({ canvasId, schemaContext, connectionType, dataSource, onChange, onRun }: AiSqlStepProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatedSql = dataSource?.sql || dataSource?.generatedSql || "";

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/explore-data/${canvasId}/ai-sql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), schemaContext, connectionType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      onChange({ mode: "ai-sql", sql: data.sql, generatedSql: data.sql });
    } catch {
      setError("Failed to reach AI service");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Natural language input */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs text-muted-foreground">Describe what you want</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Show me monthly revenue by region for the last 2 years..."
          rows={3}
          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {generating ? "Generating..." : "Generate SQL"}
        </button>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Generated SQL preview */}
      {generatedSql && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Generated SQL (editable — switch to SQL mode for full editor)</span>
          <pre className="text-[11px] bg-muted/50 border border-border rounded-md p-3 overflow-x-auto text-foreground font-mono whitespace-pre-wrap">
            {generatedSql}
          </pre>
          <button
            onClick={() => onRun(generatedSql)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Run Query
          </button>
        </div>
      )}
    </div>
  );
}
