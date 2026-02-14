"use client";

/**
 * Chat2DB — Natural Language to SQL chat interface.
 *
 * Preserves the Jupyter-based flow:
 * 1. Pick a database from the dropdown (auto-discovered connections)
 * 2. Click Connect
 * 3. Toggle "Send Tables" checkbox
 * 4. Ask questions in plain English
 *
 * Uses AI Elements (Conversation, Message, PromptInput) for the chat UI
 * and proxies requests to the FastAPI backend via Next.js API routes.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Database, Plug, Check, AlertCircle, Copy, ChevronDown, Trash2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import pako from "pako";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-groovy";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";
import "@/lib/prism-plantuml";

/** Highlight SQL with inline styles — no CSS dependency. */
function highlightSQL(sql: string): string {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|ON|AND|OR|NOT|IN|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MIN|MAX|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INTO|VALUES|SET|UNION|ALL|BETWEEN|LIKE|IS|NULL|CASE|WHEN|THEN|ELSE|END|EXISTS|DESC|ASC|WITH|RECURSIVE)\b/gi;
  const strings = /('[^']*')/g;
  const numbers = /\b(\d+(?:\.\d+)?)\b/g;

  let result = sql
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(strings, '<span style="color:#7ec699">$1</span>')
    .replace(keywords, (m) => `<span style="color:#cc99cd">${m}</span>`)
    .replace(numbers, '<span style="color:#f08d49">$1</span>');
  return result;
}

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbConnection {
  code: string;
  name: string;
  db_type: string;
  is_default: boolean;
}

interface Chat2DBResponse {
  question?: string;
  sql?: string | null;
  data?: Record<string, any>[];
  row_count?: number;
  execution_time_ms?: number;
  explanation?: string | null;
  viz_image?: string | null;
  text_response?: string | null;
  plantuml_code?: string | null;
  mermaid_code?: string | null;
  html_content?: string | null;
  error?: string | null;
  raw_content?: string | null;
}

/** Encode diagram source for Kroki.io SVG rendering. */
function krokiUrl(type: "plantuml" | "mermaid", source: string): string {
  const bytes = new TextEncoder().encode(source);
  const deflated = pako.deflate(bytes);
  const base64 = btoa(Array.from(deflated).map((b) => String.fromCharCode(b)).join(""));
  const urlSafe = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `https://kroki.io/${type}/svg/${urlSafe}`;
}

/** Open HTML content in a new browser tab (full-screen preview). */
function openHtmlInBrowser(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Build self-contained HTML that renders a Mermaid diagram via CDN (same approach as /workspaces). */
function mermaidHtml(source: string): string {
  const escaped = source.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif;}</style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</head><body>
  <pre class="mermaid">${escaped}</pre>
</body></html>`;
}

/** Open a Mermaid diagram full-screen in a new tab. */
function openMermaidFullScreen(source: string) {
  openHtmlInBrowser(mermaidHtml(source));
}

/** PlantUML diagram with Kroki.io rendering and error fallback. */
function PlantUMLDiagram({ source }: { source: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const highlighted = Prism.languages.plantuml
      ? Prism.highlight(source, Prism.languages.plantuml, "plantuml")
      : source;
    return (
      <div>
        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mb-2">
          Kroki.io failed to render this diagram — showing source code
        </div>
        <pre className="overflow-x-auto rounded-lg text-xs" style={{ margin: 0, background: "#2d2d2d", color: "#ccc", padding: "1rem" }}>
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    );
  }

  return <img src={krokiUrl("plantuml", source)} alt="PlantUML Diagram" className="max-w-full" onError={() => setFailed(true)} />;
}

/** Prism-highlighted code component for ReactMarkdown. */
function MarkdownCode({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  if (lang && Prism.languages[lang]) {
    const highlighted = Prism.highlight(code, Prism.languages[lang], lang);
    return (
      <pre className="overflow-x-auto rounded-lg text-xs my-2" style={{ margin: 0, background: "#2d2d2d", color: "#ccc", padding: "1rem" }}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  }

  // Fenced block without recognized language — dark code block, no highlighting
  if (className?.startsWith("language-")) {
    return (
      <pre className="overflow-x-auto rounded-lg text-xs my-2" style={{ margin: 0, background: "#2d2d2d", color: "#ccc", padding: "1rem" }}>
        <code>{code}</code>
      </pre>
    );
  }

  // Inline code
  return <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
}

/** Shared markdown components for ReactMarkdown — uses Prism for code highlighting. */
const markdownComponents = {
  code: MarkdownCode,
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => <>{children}</>,
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  response?: Chat2DBResponse;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Chat2DBPage() {
  // Connection state
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [connStatus, setConnStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [connError, setConnError] = useState("");
  const [sendSchema, setSendSchema] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Message history (Up/Down arrow)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const savedInput = useRef("");

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgIdCounter = useRef(0);

  const nextId = () => `msg-${++msgIdCounter.current}`;

  // ---------------------------------------------------------------------------
  // Load connections on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch("/api/chat2db/connections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConnections(data);
          const def = data.find((c: DbConnection) => c.is_default);
          if (def) setSelectedCode(def.code);
        }
      })
      .catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Connect
  // ---------------------------------------------------------------------------

  const handleConnect = useCallback(async () => {
    if (!selectedCode) return;
    setConnStatus("connecting");
    setConnError("");

    try {
      const res = await fetch("/api/chat2db/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_code: selectedCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConnStatus("error");
        setConnError(data.detail || "Connection failed");
        return;
      }

      setConnStatus("connected");
      const conn = connections.find((c) => c.code === selectedCode);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "system",
          content: `Connected to ${conn?.name || selectedCode} (${conn?.db_type || ""}). Ask me anything!`,
        },
      ]);
    } catch (e: any) {
      setConnStatus("error");
      setConnError(e.message || "Connection failed");
    }
  }, [selectedCode, connections]);

  // ---------------------------------------------------------------------------
  // Ask
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(
    async (msg: { text: string }) => {
      const question = msg.text.trim();
      if (!question || isLoading) return;

      // Add to history
      setHistory((prev) => {
        const next = prev[prev.length - 1] === question ? prev : [...prev, question];
        return next.length > 50 ? next.slice(1) : next;
      });
      setHistoryIdx(-1);

      // Add user message
      const userId = nextId();
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: question },
      ]);
      setInput("");
      // Reset textarea to 1 row after sending
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat2db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, send_schema: sendSchema }),
        });
        const data: Chat2DBResponse = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: data.text_response || data.explanation || "",
            response: data,
          },
        ]);
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            response: { error: e.message || "Request failed" },
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, sendSchema],
  );

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    setMessages([]);
    setShowClearConfirm(false);
    if (connStatus === "connected") {
      const conn = connections.find((c) => c.code === selectedCode);
      setMessages([
        {
          id: nextId(),
          role: "system",
          content: `Connected to ${conn?.name || selectedCode}. Ask me anything!`,
        },
      ]);
    }
  };

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  // ---------------------------------------------------------------------------
  // Up/Down arrow history navigation
  // ---------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      if (historyIdx === -1) {
        savedInput.current = input;
        const newIdx = history.length - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      if (historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput(savedInput.current);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const isConnected = connStatus === "connected";

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* ====== Connection bar (2-line compact layout, stays pinned) ====== */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2 space-y-1.5">
        {/* Line 1: Brand */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🦉</span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Chat2DB</span>
          <span className="text-xs text-muted-foreground">
            powered by Athena — ask in plain English, get SQL + results + charts. Refine, drill deeper, visualize.
          </span>
        </div>

        {/* Line 2: DB controls + status */}
        <div className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Dropdown */}
          <select
            id="database-selector"
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">-- Select a database --</option>
            {connections.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.db_type})
              </option>
            ))}
          </select>

          {/* Connect button */}
          <Button
            id="btn-connect-database"
            size="sm"
            onClick={handleConnect}
            disabled={!selectedCode || connStatus === "connecting"}
          >
            <Plug className="mr-1 h-3.5 w-3.5" />
            {connStatus === "connecting" ? "Connecting..." : "Connect"}
          </Button>

          {/* Send Tables checkbox */}
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={sendSchema}
              onChange={(e) => setSendSchema(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Send Tables
            <span
              title="Sends table names to Athena as a quick index. Recommended for database queries. Uncheck only for chit-chat or non-database topics."
              className="cursor-help text-muted-foreground"
            >
              &#9432;
            </span>
          </label>

          {/* Status — right-aligned, truncated to prevent 3rd line */}
          <div id="connection-status" className="ml-auto flex items-center gap-1.5 text-sm truncate">
            {connStatus === "connected" && (
              <>
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-green-600 dark:text-green-400 truncate">Connected to {selectedCode}</span>
              </>
            )}
            {connStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-red-600 dark:text-red-400 truncate">{connError}</span>
              </>
            )}
            {connStatus === "idle" && (
              <span className="text-muted-foreground">No database selected</span>
            )}
          </div>
        </div>
      </div>

      {/* ====== Chat area ====== */}
      <Conversation id="chat-conversation" className="flex-1">
        {/* Header row with Clear button */}
        {messages.length > 0 && (
          <div className="flex items-center justify-end border-b px-4 py-1.5">
            {showClearConfirm ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">Clear all messages?</span>
                <Button size="sm" variant="destructive" onClick={handleClear}>
                  Yes, clear
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(true)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        )}

        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon="🦉"
              title="Chat2DB"
              description="Select a database above, then ask questions in plain English. Athena will generate SQL, run it, and explain the results."
            />
          ) : (
            messages.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="text-center text-xs text-muted-foreground py-1">
                    — {msg.content} —
                  </div>
                );
              }

              if (msg.role === "user") {
                return (
                  <Message key={msg.id} from="user">
                    <MessageContent className="ml-auto">
                      <div className="rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        {msg.content}
                      </div>
                    </MessageContent>
                  </Message>
                );
              }

              // Assistant message
              const r = msg.response;
              return (
                <Message key={msg.id} from="assistant">
                  <MessageAvatar className="bg-indigo-500 text-white" fallback="🦉" />
                  <MessageContent>
                    <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">Athena</span>
                    {/* Error */}
                    {r?.error && (
                      <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                        {r.error}
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => copyToClipboard(r.error!, msg.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-800 px-2 py-1 text-xs text-red-500 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedId === msg.id ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text response (chit-chat, guidance) */}
                    {r?.text_response && !r?.error && (
                      <MessageResponse className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{r.text_response}</ReactMarkdown>
                      </MessageResponse>
                    )}

                    {/* SQL block (collapsible, Prism highlighted) */}
                    {r?.sql && !r?.error && (
                      <details className="rounded-xl bg-muted text-sm overflow-hidden">
                        <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground hover:bg-accent">
                          <ChevronDown className="mr-1 inline h-3 w-3" />
                          Show SQL
                        </summary>
                        <pre className="overflow-x-auto px-4 py-3 text-xs" style={{ margin: 0, background: "#2d2d2d", color: "#ccc" }}>
                          <code
                            dangerouslySetInnerHTML={{
                              __html: highlightSQL(r.sql),
                            }}
                          />
                        </pre>
                      </details>
                    )}

                    {/* Data table */}
                    {r?.data && r.data.length > 0 && !r?.error && (
                      <div className="overflow-x-auto rounded-xl border text-sm">
                        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
                          {r.row_count} row{r.row_count !== 1 ? "s" : ""}
                          {r.execution_time_ms ? ` · ${r.execution_time_ms.toFixed(0)} ms` : ""}
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              {Object.keys(r.data[0]).map((col) => (
                                <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {r.data.slice(0, 20).map((row, i) => (
                              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                                {Object.values(row).map((val, j) => (
                                  <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                                    {val === null ? (
                                      <span className="text-muted-foreground italic">null</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {r.data.length > 20 && (
                          <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
                            Showing 20 of {r.row_count} rows
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visualization */}
                    {r?.viz_image && (
                      <div className="overflow-hidden rounded-xl border">
                        <img
                          src={`data:image/png;base64,${r.viz_image}`}
                          alt="Visualization"
                          className="max-w-full"
                        />
                      </div>
                    )}

                    {/* PlantUML diagram — rendered via Kroki.io with error fallback */}
                    {r?.plantuml_code && !r?.error && (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="flex justify-between items-center px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
                          <span>PlantUML Diagram</span>
                          <button
                            onClick={() => window.open(krokiUrl("plantuml", r.plantuml_code!), "_blank")}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                          >
                            <ExternalLink className="h-3 w-3" /> View Full Screen
                          </button>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-50 flex justify-center">
                          <PlantUMLDiagram source={r.plantuml_code!} />
                        </div>
                      </div>
                    )}

                    {/* Mermaid diagram — rendered via Kroki.io with error fallback */}
                    {r?.mermaid_code && !r?.error && (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="flex justify-between items-center px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
                          <span>Mermaid Diagram</span>
                          <button
                            onClick={() => openMermaidFullScreen(r.mermaid_code!)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                          >
                            <ExternalLink className="h-3 w-3" /> View Full Screen
                          </button>
                        </div>
                        <iframe
                          srcDoc={mermaidHtml(r.mermaid_code!)}
                          sandbox="allow-scripts"
                          className="w-full border-0"
                          style={{ minHeight: "400px" }}
                        />
                      </div>
                    )}

                    {/* HTML preview */}
                    {r?.html_content && !r?.error && (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="flex justify-between items-center px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
                          <span>HTML Preview</span>
                          <button
                            onClick={() => openHtmlInBrowser(r.html_content!)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                          >
                            <ExternalLink className="h-3 w-3" /> View Full Screen
                          </button>
                        </div>
                        <iframe
                          srcDoc={r.html_content}
                          sandbox="allow-scripts"
                          className="w-full border-0"
                          style={{ minHeight: "300px" }}
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    {r?.explanation && !r?.text_response && !r?.error && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{r.explanation}</ReactMarkdown>
                      </div>
                    )}

                    {/* Copy button */}
                    {r?.raw_content && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => copyToClipboard(r.raw_content!, msg.id)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
                          title="Copy Athena's response"
                        >
                          {copiedId === msg.id ? (
                            <><Check className="h-3 w-3" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}

          {/* Thinking indicator */}
          {isLoading && (
            <Message from="assistant">
              <MessageAvatar className="bg-indigo-500 text-white" fallback="🦉" />
              <MessageContent>
                <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">Athena</span>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <span className="animate-pulse">Thinking</span>
                  <span className="flex gap-0.5">
                    <span className="animate-bounce [animation-delay:0ms]">.</span>
                    <span className="animate-bounce [animation-delay:150ms]">.</span>
                    <span className="animate-bounce [animation-delay:300ms]">.</span>
                  </span>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
      </Conversation>

      {/* ====== Input bar ====== */}
      <div className="border-t bg-background px-4 py-3">
        <PromptInput
          id="chat-input-form"
          onSubmit={handleSubmit}
          className="mx-auto max-w-4xl"
        >
          <PromptInputTextarea
            id="chat-input-textarea"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setHistoryIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? "Ask a question about your data..."
                : "Connect to a database first..."
            }
            disabled={!isConnected || isLoading}
          />
          <PromptInputSubmit
            id="btn-submit-chat"
            status={isLoading ? "streaming" : "ready"}
            disabled={!isConnected || !input.trim()}
          />
        </PromptInput>
      </div>
    </div>
  );
}
