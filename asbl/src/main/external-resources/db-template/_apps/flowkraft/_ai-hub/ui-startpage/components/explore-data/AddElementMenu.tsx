"use client";

import { useState } from "react";
import { Plus, Type, Minus, ListFilter, Frame } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { WidgetType } from "@/lib/stores/canvas-store";

const ITEMS: { type: WidgetType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "text", label: "Text Block", icon: Type, description: "Notes, headings, captions" },
  { type: "divider", label: "Divider", icon: Minus, description: "Visual separator" },
  { type: "iframe", label: "iFrame", icon: Frame, description: "Embed an external page" },
  { type: "filter-pane", label: "Filter Pane", icon: ListFilter, description: "Associative exploration" },
];

export function AddElementMenu() {
  const addWidget = useCanvasStore((s) => s.addWidget);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        id="btnAddElement"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent border border-border transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add element
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-56 rounded-md border border-border bg-background shadow-lg overflow-hidden">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  id={`btnAddElement-${item.type}`}
                  type="button"
                  onClick={() => { addWidget(item.type); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-xs">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
