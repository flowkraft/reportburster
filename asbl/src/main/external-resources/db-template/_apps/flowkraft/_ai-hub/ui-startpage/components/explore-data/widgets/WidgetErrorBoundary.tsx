"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Wraps a single explore-data widget. When the child throws during render or
 * inside a lifecycle method, the rest of the canvas keeps working; this
 * widget slot shows a compact error card with a retry button.
 *
 * React Error Boundaries can only be class components — this is the sole
 * class component in the explore-data folder, kept minimal on purpose.
 *
 * The caller should pass `resetKey={widgetId}` so changing the active widget
 * inside a slot (e.g. swapping viz types) auto-clears any prior error without
 * requiring the user to click retry.
 */
interface WidgetErrorBoundaryProps {
  children: ReactNode;
  /** When this changes, the boundary clears any error and re-renders. */
  resetKey?: string | number;
}

interface WidgetErrorBoundaryState {
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: WidgetErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log the full stack so it's visible in browser console without the
    // user having to expand the card. Canvas keeps working either way.
    console.error("[widget-error]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error.message || error.name || "Unknown error";
    return (
      <div className="flex h-full w-full items-center justify-center p-3 overflow-auto">
        <div className="max-w-full w-full">
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground">This widget crashed</div>
              <div className="mt-1 text-[11px] text-muted-foreground break-words">{message}</div>
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-accent border border-border"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
