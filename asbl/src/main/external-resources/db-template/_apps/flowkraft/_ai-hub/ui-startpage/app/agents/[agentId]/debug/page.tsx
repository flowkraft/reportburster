'use client';

import React, { useEffect, useState, useMemo, use, useRef } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChevronLeft, ChevronDown, ChevronRight, Wrench, Database, Brain, MessageSquare, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AgentState = any;

// Simple Accordion component (since we don't have PrimeReact)
function Accordion({ 
  children, 
  activeIndex, 
  onTabChange 
}: { 
  children: React.ReactNode; 
  activeIndex: number | null; 
  onTabChange: (e: { index: number | null }) => void;
}) {
  return <div className="space-y-1">{children}</div>;
}

function AccordionTab({ 
  header, 
  children, 
  isActive, 
  onToggle 
}: { 
  header: React.ReactNode; 
  children: React.ReactNode; 
  isActive?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded">
      <button 
        onClick={onToggle}
        className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm"
      >
        {header}
        {isActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isActive && (
        <div className="px-3 py-2 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// Simple Tabs component
function Tabs({ 
  tabs, 
  activeTab, 
  onTabChange 
}: { 
  tabs: { key: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  return (
    <div className="flex border-b border-gray-200 mb-2">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === tab.key 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  );
}

export default function AgentDebugPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);

  const [agent, setAgent] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingSystem, setEditingSystem] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const data = await res.json();
      setAgent(data);
      setEditingSystem(data?.system ?? '');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!agentId) return;
    fetchAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const saveAgent = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: editingSystem }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const data = await res.json();
      setAgent(data);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  // Chat simulator transport
  const transport = useMemo(() => {
    if (!agentId) return undefined;
    return new DefaultChatTransport({ api: '/api/chat', body: { agentId } });
  }, [agentId]);

  const [streamEvents, setStreamEvents] = useState<any[]>([]);
  const { messages, setMessages, sendMessage, status } = useChat({
    transport,
    messages: [],
    onData: (chunk: any) => {
      try {
        setStreamEvents((s) => [{ time: Date.now(), chunk }, ...s].slice(0, 50));

        if (chunk && typeof chunk === 'object' && chunk.type) {
          if (chunk.type === 'text-start') {
            setMessages((prev: any[]) => {
              const msgs = [...prev];
              msgs.push({ id: `assistant-${chunk.id ?? Date.now()}`, role: 'assistant', parts: [{ type: 'text', text: '' }] });
              return msgs;
            });
          } else if (chunk.type === 'text-delta') {
            setMessages((prev: any[]) => {
              const msgs = [...prev];
              let idx = -1;
              for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].role === 'assistant') { idx = i; break; }
              }
              if (idx === -1) {
                msgs.push({ id: `assistant-${chunk.id ?? Date.now()}`, role: 'assistant', parts: [{ type: 'text', text: chunk.delta || '' }] });
              } else {
                const msg = { ...msgs[idx] };
                msg.parts = msg.parts ? [...msg.parts] : [];
                const textPartIndex = msg.parts.findIndex((p: any) => p.type === 'text');
                if (textPartIndex === -1) {
                  msg.parts.push({ type: 'text', text: chunk.delta || '' });
                } else {
                  const part = { ...msg.parts[textPartIndex] };
                  part.text = (part.text || '') + (chunk.delta || '');
                  msg.parts[textPartIndex] = part;
                }
                msgs[idx] = msg;
              }
              return msgs;
            });
          }
        }
      } catch (e) {}
    }
  });

  const [msgText, setMsgText] = useState('');
  const [dots, setDots] = useState('.');
  const [activeMemoryIdx, setActiveMemoryIdx] = useState<number | null>(0);
  const [archiveQuery, setArchiveQuery] = useState<string>('');
  const [activeToolsTab, setActiveToolsTab] = useState('toolsTab');
  
  // Tool source code viewer state
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [toolSourceCode, setToolSourceCode] = useState<string>('');
  const [loadingToolSource, setLoadingToolSource] = useState(false);

  // Sleeptime details state
  const [sleeptimeLoading, setSleeptimeLoading] = useState(false);
  const [sleeptimeError, setSleeptimeError] = useState<string | null>(null);
  const [sleeptimeAgent, setSleeptimeAgent] = useState<any | null>(null);
  const [sleeptimeActiveMemoryIdx, setSleeptimeActiveMemoryIdx] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') {
      const id = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 400);
      return () => clearInterval(id);
    }
    setDots('.');
  }, [status]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch sleeptime agent details when the main agent has sleeptime enabled
  useEffect(() => {
    if (!agent || !agentId) return;
    if (!agent.enable_sleeptime) return;

    let mounted = true;
    setSleeptimeLoading(true);
    setSleeptimeError(null);
    setSleeptimeAgent(null);

    (async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}/sleeptime`);
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        const data = await res.json();
        if (!mounted) return;
        setSleeptimeAgent(data?.sleeptimeAgent ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setSleeptimeError(e?.message || String(e));
      } finally {
        if (!mounted) return;
        setSleeptimeLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [agent, agentId]);

  // Default expand first sleeptime memory block
  useEffect(() => {
    if (!sleeptimeAgent) {
      setSleeptimeActiveMemoryIdx(null);
      return;
    }
    const blocks = sleeptimeAgent.memoryBlocks || [];
    setSleeptimeActiveMemoryIdx(blocks.length > 0 ? 0 : null);
  }, [sleeptimeAgent]);

  const onSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msgText.trim()) return;
    sendMessage({ text: msgText });
    setMsgText('');
  };

  // Format a number into a short human-readable form for token counts
  const formatShort = (n: number) => {
    if (!Number.isFinite(n) || n === 0) return '0';
    if (n < 1000) return String(n);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    return `${(n / 1000).toFixed(1)}k`;
  };

  // Quick heuristic to estimate tokens from characters
  const estimateTokens = (chars: number) => Math.max(1, Math.round(chars / 4));

  // Fetch tool source code when a custom tool is selected
  const fetchToolSourceCode = async (toolId: string) => {
    try {
      setLoadingToolSource(true);
      const res = await fetch(`/api/tools/${toolId}`);
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const toolData = await res.json();
      setToolSourceCode(toolData.source_code || '// No source code available');
    } catch (e: any) {
      setToolSourceCode(`// Error loading source code: ${e?.message || String(e)}`);
    } finally {
      setLoadingToolSource(false);
    }
  };

  const handleToolClick = (tool: any) => {
    if (selectedTool?.id === tool.id) {
      setSelectedTool(null);
      setToolSourceCode('');
    } else {
      setSelectedTool(tool);
      fetchToolSourceCode(tool.id);
    }
  };

  // Tool categorization
  const MEMORY_BLOCK_TOOLS = ['memory', 'memory_insert', 'memory_replace', 'memory_rethink', 'memory_finish_edits'];
  const RECALL_MEMORY_TOOLS = ['conversation_search'];
  const ARCHIVAL_MEMORY_TOOLS = ['archival_memory_insert', 'archival_memory_search'];

  const tools = agent?.tools || [];
  const customTools = tools.filter((t: any) => t.tool_type === 'custom');
  const memoryBlockTools = tools.filter((t: any) => MEMORY_BLOCK_TOOLS.includes(String(t.name)));
  const recallTools = tools.filter((t: any) => RECALL_MEMORY_TOOLS.includes(String(t.name)));
  const archivalTools = tools.filter((t: any) => ARCHIVAL_MEMORY_TOOLS.includes(String(t.name)));
  const customToolIds = new Set(customTools.map((t: any) => t.id));
  const allKnownToolNames = [...MEMORY_BLOCK_TOOLS, ...RECALL_MEMORY_TOOLS, ...ARCHIVAL_MEMORY_TOOLS];
  const otherTools = tools.filter((t: any) => !customToolIds.has(t.id) && !allKnownToolNames.includes(String(t.name)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/agents" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Agents
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            {agent ? `${agent.name ?? ''} (${(agent.metadata?.agentKey) ?? agent.id})` : 'Loading...'}
            {agent?.enable_sleeptime && (
              <span className="ml-2 text-sm font-normal text-gray-500" title="Sleeptime enabled">
                💤 Sleeptime
              </span>
            )}
          </h1>
          {agent?.description && (
            <p className="text-gray-600 mt-1">{agent.description}</p>
          )}
        </div>

        {loading && <div className="text-gray-500">Loading agent details...</div>}
        {error && <div className="text-red-500 bg-red-50 p-3 rounded">Error: {error}</div>}

        {!loading && agent && (
          <>
            <div className="grid grid-cols-12 gap-4">
              {/* LEFT PANEL - Model, System, Tags, Tools */}
              <div className="col-span-3 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Model */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <Settings className="w-4 h-4" />
                    Model
                  </div>
                  <div className="text-sm bg-gray-50 px-2 py-1 rounded">{agent.model}</div>
                </div>

                {/* System Instructions */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    System Instructions
                    {agent.system && (
                      <span className="text-xs text-gray-400">
                        ({formatShort(estimateTokens(String(agent.system).length))} tokens)
                      </span>
                    )}
                  </div>
                  <div className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                    {agent.system || <em className="text-gray-400">No system instructions</em>}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const t = Array.isArray(agent.tags) && agent.tags.length > 0 ? agent.tags : (Array.isArray(agent.metadata?.tags) ? agent.metadata.tags : []);
                      if (!t || t.length === 0) return <span className="text-xs text-gray-400">No tags</span>;
                      return t.map((tg: any) => (
                        <span key={String(tg)} className="text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          {tg}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Tools / Sources Tabs */}
                <Tabs 
                  tabs={[
                    { key: 'toolsTab', label: 'Tools', count: tools.length },
                    { key: 'sourcesTab', label: 'Sources', count: (agent.sources || []).length }
                  ]}
                  activeTab={activeToolsTab}
                  onTabChange={setActiveToolsTab}
                />

                {activeToolsTab === 'toolsTab' && (
                  <div className="space-y-3 text-xs">
                    {tools.length === 0 ? (
                      <div className="text-gray-400">No tools</div>
                    ) : (
                      <>
                        {/* Memory Block Editing */}
                        <div>
                          <div className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Brain className="w-3 h-3" /> Memory Block ({memoryBlockTools.length})
                          </div>
                          {memoryBlockTools.length === 0 ? (
                            <div className="text-gray-400 ml-4">none</div>
                          ) : (
                            <ul className="ml-4 space-y-0.5">
                              {memoryBlockTools.map((t: any) => <li key={t.id ?? t.name}>{t.name || t.id}</li>)}
                            </ul>
                          )}
                        </div>

                        {/* Recall Memory */}
                        <div>
                          <div className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Recall Memory ({recallTools.length})
                          </div>
                          {recallTools.length === 0 ? (
                            <div className="text-gray-400 ml-4">none</div>
                          ) : (
                            <ul className="ml-4 space-y-0.5">
                              {recallTools.map((t: any) => <li key={t.id ?? t.name}>{t.name || t.id}</li>)}
                            </ul>
                          )}
                        </div>

                        {/* Archival Memory */}
                        <div>
                          <div className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Database className="w-3 h-3" /> Archival Memory ({archivalTools.length})
                          </div>
                          {archivalTools.length === 0 ? (
                            <div className="text-gray-400 ml-4">none</div>
                          ) : (
                            <ul className="ml-4 space-y-0.5">
                              {archivalTools.map((t: any) => <li key={t.id ?? t.name}>{t.name || t.id}</li>)}
                            </ul>
                          )}
                        </div>

                        {/* Custom Tools */}
                        <div>
                          <div className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Custom Tools ({customTools.length})
                          </div>
                          {customTools.length === 0 ? (
                            <div className="text-gray-400 ml-4">none</div>
                          ) : (
                            <>
                              <ul className="ml-4 space-y-0.5">
                                {customTools.map((t: any) => (
                                  <li 
                                    key={t.id ?? t.name}
                                    className={`cursor-pointer hover:text-blue-600 ${selectedTool?.id === t.id ? 'text-blue-600 font-medium' : ''}`}
                                    onClick={() => handleToolClick(t)}
                                  >
                                    <span className="underline">{t.name || t.id}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {selectedTool && (
                                <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50">
                                  <div className="font-semibold mb-1">
                                    {selectedTool.name} - Source
                                    {loadingToolSource && <span className="ml-2 text-gray-400">Loading...</span>}
                                  </div>
                                  <textarea
                                    readOnly
                                    value={toolSourceCode}
                                    className="w-full h-48 font-mono text-[10px] p-2 border border-gray-200 rounded bg-white resize-y"
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Other Tools */}
                        {otherTools.length > 0 && (
                          <div>
                            <div className="font-semibold text-gray-600 mb-1">Other ({otherTools.length})</div>
                            <ul className="ml-4 space-y-0.5">
                              {otherTools.map((t: any) => <li key={t.id ?? t.name}>{t.name || t.id}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeToolsTab === 'sourcesTab' && (
                  <div className="text-xs">
                    {(agent.sources || []).length === 0 ? (
                      <div className="text-gray-400">No sources</div>
                    ) : (
                      <ul className="space-y-0.5">
                        {(agent.sources || []).map((s: any) => (
                          <li key={s.id ?? s.name}>{s.name || s.id}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* MIDDLE PANEL - Chat Simulator */}
              <div className="col-span-5 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Agent Simulator
                </h3>

                <div className="border border-gray-200 rounded p-3 h-[420px] overflow-auto bg-gray-50">
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-white border border-gray-100 mr-8'}`}>
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          {m.role.toUpperCase()}
                        </div>
                        {m.parts?.map((p: any, i: number) => (
                          <div key={i}>
                            {p.type === 'text' && <div className="text-sm whitespace-pre-wrap">{p.text}</div>}
                            {p.type === 'reasoning' && <div className="text-sm text-blue-600 italic">💭 {p.text}</div>}
                          </div>
                        ))}
                      </div>
                    ))}

                    {(status === 'submitted' || status === 'streaming') && (
                      <div className="text-gray-500 text-sm">💬 Thinking{dots}</div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </div>

                <form onSubmit={onSubmit} className="mt-3 flex gap-2">
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" disabled={status !== 'ready'} size="sm">
                    {status === 'streaming' ? '...' : 'Send'}
                  </Button>
                </form>

                {/* Stream debug info */}
                {streamEvents.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    <div className="font-semibold">Recent stream events:</div>
                    {streamEvents.slice(0, 3).map((e, i) => (
                      <div key={i}>
                        {typeof e.chunk === 'object' && e.chunk?.type
                          ? `${e.chunk.type} ${e.chunk?.delta ? `(+${String(e.chunk.delta).length})` : ''}`
                          : String(e.chunk).slice(0, 60)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT PANEL - Context Window */}
              <div className="col-span-4 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Context Window</h3>

                {/* Usage bar */}
                {(() => {
                  const blocks = agent.memory?.blocks || [];
                  const totalChars = blocks.reduce((acc: number, b: any) => acc + String(b.value || '').length, 0);
                  const totalTokens = estimateTokens(totalChars);
                  const maxTokens = (agent.llm_config && agent.llm_config.context_window) ? agent.llm_config.context_window : 4096;
                  const pct = Math.min(100, Math.round((totalTokens / maxTokens) * 100));
                  const systLen = String(agent.system || '').length;
                  const systTokens = estimateTokens(systLen);
                  const usesDefaultMax = !agent.llm_config || !agent.llm_config.context_window;
                  
                  return (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Usage</span>
                        <span title={`memory: ${totalTokens} tok; system: ${systTokens} tok`}>
                          {formatShort(totalTokens)}{agent.system && ` + ${formatShort(systTokens)}`} / {formatShort(maxTokens)} tokens
                          {usesDefaultMax && ' (assumed)'}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-400 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {agent.system && (
                        <div className="text-xs text-gray-400 mt-1">
                          System instructions: {formatShort(systTokens)} tokens
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Memory Blocks Accordion */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Memory Blocks</div>
                  {(agent.memory?.blocks || []).length === 0 ? (
                    <div className="text-xs text-gray-400">No core memory</div>
                  ) : (
                    <div className="space-y-1">
                      {(agent.memory?.blocks || []).map((b: any, idx: number) => {
                        const sharedOwners = Array.isArray(b?.metadata?.sharedOwners) ? b.metadata.sharedOwners : [];
                        const isShared = agent?.enable_sleeptime && sharedOwners.length > 1;
                        const blkLen = String(b.value || '').length;
                        const isActive = activeMemoryIdx === idx;

                        return (
                          <AccordionTab
                            key={b.id ?? b.label}
                            isActive={isActive}
                            onToggle={() => setActiveMemoryIdx(isActive ? null : idx)}
                            header={
                              <div className="flex items-center gap-2">
                                <span>{b.label}</span>
                                <span className="text-xs text-gray-400">
                                  ({formatShort(estimateTokens(blkLen))})
                                </span>
                                {isShared && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                    shared
                                  </span>
                                )}
                              </div>
                            }
                          >
                            <div className="text-xs whitespace-pre-wrap max-h-48 overflow-auto font-mono">
                              {b.value}
                            </div>
                          </AccordionTab>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Archives */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2">Archival Memories</div>
                  <input
                    placeholder="Search archives..."
                    value={archiveQuery}
                    onChange={(e) => setArchiveQuery(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded mb-2"
                  />
                  {(() => {
                    const filtered = (agent.archives || []).filter((a: any) => 
                      String(a.name || '').toLowerCase().includes(archiveQuery.toLowerCase())
                    );
                    if (filtered.length === 0) return <div className="text-xs text-gray-400">No archives</div>;
                    return (
                      <ul className="text-xs space-y-0.5">
                        {filtered.map((a: any) => <li key={a.id}>{a.name}</li>)}
                      </ul>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* SLEEPTIME SECTION */}
            {agent.enable_sleeptime && (
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  💤 Sleeptime Variant
                </h3>

                {sleeptimeLoading && <div className="text-gray-500 text-sm">Loading sleeptime details...</div>}
                {sleeptimeError && <div className="text-red-500 text-sm">Error: {sleeptimeError}</div>}
                {!sleeptimeLoading && !sleeptimeError && !sleeptimeAgent && (
                  <div className="text-gray-400 text-sm">No sleeptime agent found sharing memory with this agent.</div>
                )}

                {sleeptimeAgent && (
                  <div className="grid grid-cols-3 gap-4">
                    {/* Sleeptime Agent Info */}
                    <div>
                      <div className="text-sm font-medium mb-2">
                        {sleeptimeAgent.name ?? sleeptimeAgent.id}
                        {sleeptimeAgent.metadata?.agentKey && (
                          <span className="text-gray-400 font-normal"> ({sleeptimeAgent.metadata.agentKey})</span>
                        )}
                      </div>
                      
                      <div className="text-xs font-semibold text-gray-600 mb-1">Attached Archives</div>
                      {(!sleeptimeAgent.archives || sleeptimeAgent.archives.length === 0) ? (
                        <div className="text-xs text-gray-400">No archives</div>
                      ) : (
                        <ul className="text-xs space-y-0.5">
                          {sleeptimeAgent.archives.map((a: any) => <li key={a.id}>{a.name}</li>)}
                        </ul>
                      )}
                    </div>

                    {/* Sleeptime Memory Blocks */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2">Memory Blocks</div>
                      {(!sleeptimeAgent.memoryBlocks || sleeptimeAgent.memoryBlocks.length === 0) ? (
                        <div className="text-xs text-gray-400">No memory blocks</div>
                      ) : (
                        <div className="space-y-1">
                          {(sleeptimeAgent.memoryBlocks || []).map((b: any, idx: number) => {
                            const sharedOwners = Array.isArray(b?.metadata?.sharedOwners) ? b.metadata.sharedOwners : [];
                            const isShared = sharedOwners.length > 1;
                            const blkLen = String(b.value || '').length;
                            const isActive = sleeptimeActiveMemoryIdx === idx;

                            return (
                              <AccordionTab
                                key={b.id ?? b.label}
                                isActive={isActive}
                                onToggle={() => setSleeptimeActiveMemoryIdx(isActive ? null : idx)}
                                header={
                                  <div className="flex items-center gap-2">
                                    <span>{b.label}</span>
                                    <span className="text-xs text-gray-400">
                                      ({formatShort(estimateTokens(blkLen))})
                                    </span>
                                    {isShared && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                        shared
                                      </span>
                                    )}
                                  </div>
                                }
                              >
                                <div className="text-xs whitespace-pre-wrap max-h-32 overflow-auto font-mono">
                                  {b.value}
                                </div>
                              </AccordionTab>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sleeptime Tools */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        Tools ({sleeptimeAgent.tools?.length || 0})
                      </div>
                      {(!sleeptimeAgent.tools || sleeptimeAgent.tools.length === 0) ? (
                        <div className="text-xs text-gray-400">No tools attached</div>
                      ) : (
                        <ul className="text-xs space-y-0.5">
                          {sleeptimeAgent.tools.map((tool: any) => {
                            const tags = tool.tags || [];
                            const isCustom = tags.includes('ai-flowstack') || tags.includes('custom');
                            const isBase = tags.includes('base') || (!isCustom && tags.length === 0);
                            return (
                              <li key={tool.id} className="flex items-center gap-1">
                                <span className="text-blue-600">{tool.name}</span>
                                {isCustom && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-green-100 text-green-700">custom</span>
                                )}
                                {isBase && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700">base</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
