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
import { Database, Plug, Check, AlertCircle, Copy, ChevronDown, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
  error?: string | null;
  raw_content?: string | null;
}

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
      {/* ====== Connection bar ====== */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 mr-1">
          <span className="text-lg">🦉</span>
          <div className="leading-tight">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Chat2DB</span>
            <span className="text-xs text-muted-foreground ml-1.5">powered by Athena — ask in plain English, get SQL + results + charts. Refine, drill deeper, visualize.</span>
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <Database className="h-4 w-4 text-muted-foreground" />

        {/* Dropdown */}
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
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

        {/* Status */}
        <div className="ml-auto flex items-center gap-1.5 text-sm">
          {connStatus === "connected" && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Connected to {selectedCode}</span>
            </>
          )}
          {connStatus === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{connError}</span>
            </>
          )}
          {connStatus === "idle" && (
            <span className="text-muted-foreground">No database selected</span>
          )}
        </div>
      </div>

      {/* ====== Chat area ====== */}
      <Conversation className="flex-1">
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
                        <ReactMarkdown>{r.text_response}</ReactMarkdown>
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

                    {/* Explanation */}
                    {r?.explanation && !r?.text_response && !r?.error && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
                        <ReactMarkdown>{r.explanation}</ReactMarkdown>
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
          onSubmit={handleSubmit}
          className="mx-auto max-w-4xl"
        >
          <PromptInputTextarea
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
            status={isLoading ? "streaming" : "ready"}
            disabled={!isConnected || !input.trim()}
          />
        </PromptInput>
      </div>
    </div>
  );
}
