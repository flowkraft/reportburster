"use client";

import { useState, useCallback } from "react";
import { Code, Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });

const DSL_EXAMPLES: Record<string, string> = {
  chart: `chart('myChart') {
  type 'bar'
  data {
    labelField 'category'
    datasets {
      dataset {
        field 'revenue'
        label 'Revenue'
        backgroundColor 'rgba(59, 130, 246, 0.5)'
        borderColor '#3b82f6'
      }
    }
  }
}`,
  tabulator: `tabulator('myTable') {
  layout "fitColumns"
  columns {
    column { title "Name"; field "name"; headerFilter "input" }
    column { title "Revenue"; field "revenue"; hozAlign "right"; sorter "number"; formatter "money" }
  }
}`,
  pivot: `pivotTable('myPivot') {
  rows 'country'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table Heatmap'
}`,
  "filter-pane": `filterPane('myFilter') {
  field 'ShipCountry'
  label 'Country'
  sort 'asc'              // 'asc', 'desc', 'count_desc', 'none'
  showCount true           // show (128) next to each value
  // maxValues 500         // safety limit
  // showSearch true       // auto when >10 values
  // defaultSelected 'Germany', 'France'
  // multiSelect true      // allow multiple selections
  // height '300px'        // fixed height with scroll
}`,
  kpi: `// KPI uses rb-value — no DSL needed
// Configure field, format, and label in the Display tab`,
};

interface DslCustomizerProps {
  dsl: string;
  onChange: (dsl: string) => void;
  canvasId: string;
  componentType: string;
}

export function DslCustomizer({ dsl, onChange, canvasId, componentType }: DslCustomizerProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiCustomize = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/data-canvas/${canvasId}/ai-sql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Modify this ${componentType} Groovy DSL configuration based on the user's request.\n\nCurrent DSL:\n${dsl}\n\nUser request: ${aiPrompt}\n\nReturn ONLY the modified DSL code, no explanation.`,
          schemaContext: `Component type: ${componentType} DSL configuration`,
          connectionType: "groovy-dsl",
        }),
      });
      const data = await res.json();
      if (data.sql) {
        onChange(data.sql);
        setAiPrompt("");
      }
    } catch {
      // Silent — user can edit manually
    } finally {
      setAiLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Code className="w-3.5 h-3.5" />
        Customize with DSL
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Groovy DSL</span>
        <div className="flex items-center gap-2">
          {DSL_EXAMPLES[componentType] && !dsl && (
            <button
              onClick={() => onChange(DSL_EXAMPLES[componentType])}
              className="text-[10px] text-primary hover:underline"
            >
              Load example
            </button>
          )}
          <button onClick={() => setExpanded(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
            Collapse
          </button>
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {CodeMirror && (
          <CodeMirror
            value={dsl}
            onChange={onChange}
            height="140px"
            theme="dark"
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
          />
        )}
      </div>

      {/* AI customization */}
      <div className="flex gap-1.5">
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ask AI to customize..."
          className="flex-1 text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
          onKeyDown={(e) => { if (e.key === "Enter") handleAiCustomize(); }}
        />
        <button
          onClick={handleAiCustomize}
          disabled={aiLoading || !aiPrompt.trim()}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
