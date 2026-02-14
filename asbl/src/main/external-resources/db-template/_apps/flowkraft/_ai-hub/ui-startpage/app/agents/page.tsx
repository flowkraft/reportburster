'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info, Code, Rocket, Loader2, Copy, X, CheckCircle2, XCircle, Terminal, FolderOpen, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LLMProviderForm } from '@/components/llm/LLMProviderForm';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/settings';
import { DEFAULT_LLM_FULL_CONFIG, type LLMFullConfig } from '@/lib/llm-providers';

// Short descriptions for display (avoids importing heavy agent configs into client bundle)
const AGENT_DESCRIPTIONS: Record<string, string> = {
  'Athena': 'ReportBurster Guru & Data Modeling/Business Analysis Expert',
  'Hephaestus': 'Backend Jobs/ETL/Automation Expert',
  'Hermes': 'Grails Guru & Web Portal Expert',
  'Pythia': 'WordPress CMS Web Portal Expert',
  'Apollo': 'Next.js Guru & Modern Web Expert',
};

// Tag prefixes that identify alternative stack agents (hidden by default)
const ALTERNATIVE_STACK_PREFIXES = ['stack:nextjs', 'stack:wordpress'];

// Sample agent data - fallback if API fails
const sampleAgents = [
  {
    id: 'agent-1',
    name: 'Research Assistant',
    tags: ['research', 'analysis', 'data'],
    description: 'Helps with research tasks, data analysis, and summarization',
    whenToUse: 'When you need to analyze data, research topics, or summarize information',
    matrixRoom: '@research-assistant:localhost',
  },
  {
    id: 'agent-2',
    name: 'Code Review Bot',
    tags: ['code', 'review', 'quality'],
    description: 'Reviews code for best practices, bugs, and improvements',
    whenToUse: 'When you need code reviews, refactoring suggestions, or quality checks',
    matrixRoom: '@code-review:localhost',
  },
  {
    id: 'agent-3',
    name: 'Documentation Writer',
    tags: ['docs', 'writing', 'technical'],
    description: 'Creates and maintains technical documentation',
    whenToUse: 'When you need to write docs, API references, or user guides',
    matrixRoom: '@doc-writer:localhost',
  },
  {
    id: 'agent-4',
    name: 'Testing Assistant',
    tags: ['testing', 'qa', 'automation'],
    description: 'Helps create tests, test plans, and QA strategies',
    whenToUse: 'When you need to write tests, create test plans, or automate testing',
    matrixRoom: '@testing-assistant:localhost',
  },
  {
    id: 'agent-5',
    name: 'DevOps Helper',
    tags: ['devops', 'deployment', 'ci/cd'],
    description: 'Assists with deployment, CI/CD, and infrastructure tasks',
    whenToUse: 'When you need help with deployments, CI/CD pipelines, or infrastructure',
    matrixRoom: '@devops-helper:localhost',
  },
];

type Agent = typeof sampleAgents[0];

type LogLine = { type: 'log' | 'error' | 'warn'; message: string; ts: string };

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showProvisionConfirm, setShowProvisionConfirm] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [logStatus, setLogStatus] = useState<'running' | 'success' | 'error'>('running');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [giveDbQueryToolToAthena, setGiveDbQueryToolToAthena] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'update' | 'provider'>('update');
  const [llmConfig, setLlmConfig] = useState<LLMFullConfig>(DEFAULT_LLM_FULL_CONFIG);
  const [llmConfigLoaded, setLlmConfigLoaded] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  // Listen for "Update Agents" triggered from the navbar settings menu
  useEffect(() => {
    const handler = () => {
      setForceUpdate(false);
      setGiveDbQueryToolToAthena(false);
      setSettingsTab('update');
      setShowUpdateConfirm(true);
    };
    window.addEventListener('trigger-update-agents', handler);
    return () => window.removeEventListener('trigger-update-agents', handler);
  }, []);

  // Load LLM provider config when the settings dialog opens
  useEffect(() => {
    if (showUpdateConfirm && !llmConfigLoaded) {
      getSetting(SETTING_KEYS.LLM_PROVIDER).then((raw) => {
        if (raw) {
          try {
            setLlmConfig(JSON.parse(raw) as LLMFullConfig);
          } catch {
            setLlmConfig(DEFAULT_LLM_FULL_CONFIG);
          }
        }
        setLlmConfigLoaded(true);
      });
    }
    if (!showUpdateConfirm) {
      setLlmConfigLoaded(false);
    }
  }, [showUpdateConfirm, llmConfigLoaded]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success && data.agents.length > 0) {
        // Filter out sleeptime/internal agents (Letta creates companion
        // agents named "{Name}-sleeptime" that users should never see)
        const userAgents = data.agents.filter(
          (a: any) =>
            a.metadata?.agentKey &&
            !a.name?.toLowerCase().includes('sleeptime')
        );
        // Map Letta agents to our format
        const mappedAgents = userAgents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          tags: (Array.isArray(agent.tags) && agent.tags.length > 0)
            ? agent.tags
            : (agent.metadata?.tags || []),
          description: agent.system || 'No description available',
          whenToUse: 'Contact this agent for assistance',
          matrixRoom: `@${agent.name.toLowerCase().replace(/\s+/g, '-')}:localhost`,
        }));

        // Sort: Athena first, then non-alternatives alphabetically, alternatives last
        mappedAgents.sort((a: Agent, b: Agent) => {
          const aIsAthena = a.name === 'Athena' || a.tags.includes('reportburster');
          const bIsAthena = b.name === 'Athena' || b.tags.includes('reportburster');
          if (aIsAthena && !bIsAthena) return -1;
          if (!aIsAthena && bIsAthena) return 1;

          const aIsAlt = a.tags.some((t: string) => ALTERNATIVE_STACK_PREFIXES.some(prefix => t.startsWith(prefix)));
          const bIsAlt = b.tags.some((t: string) => ALTERNATIVE_STACK_PREFIXES.some(prefix => t.startsWith(prefix)));
          if (aIsAlt && !bIsAlt) return 1;
          if (!aIsAlt && bIsAlt) return -1;

          return a.name.localeCompare(b.name);
        });

        setAgents(mappedAgents);
      } else {
        // No agents found
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents from Letta');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionAgents = async (force: boolean = true, giveDbQuery: boolean = false) => {
    try {
      setProvisioning(true);
      setLogLines([]);
      setLogStatus('running');
      setShowLogModal(true);

      // Update .env file with saved LLM provider config before provisioning
      try {
        const envRes = await fetch('/api/llm/update-env', { method: 'POST' });
        const envData = await envRes.json();
        if (envData.success) {
          const lines: LogLine[] = [
            { type: 'log', message: `Updated .env → ${envData.provider} (model: ${envData.model})`, ts: new Date().toISOString() },
          ];
          if (envData.providerChanged) {
            lines.push({
              type: 'warn',
              message: 'Provider changed — stop and start your FlowKraft\'s AI Hub application again to apply new API keys',
              ts: new Date().toISOString(),
            });
          }
          setLogLines(prev => [...lines, ...prev]);
        } else if (envData.error) {
          setLogLines(prev => [
            { type: 'warn', message: `Could not update .env: ${envData.error}`, ts: new Date().toISOString() },
            ...prev,
          ]);
        }
      } catch {
        setLogLines(prev => [
          { type: 'warn', message: 'Could not update .env (API Provider may not be configured yet)', ts: new Date().toISOString() },
          ...prev,
        ]);
      }

      const response = await fetch('/api/agents/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force, giveDbQueryToolToAthena: giveDbQuery, stream: true }),
      });

      // Non-OK response (e.g. 400 no API key configured) — fall back to JSON
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || 'Failed to provision agents', { duration: 5000 });
        setLogStatus('error');
        setLogLines([{
          type: 'error',
          message: data.message || 'Failed to provision agents',
          ts: new Date().toISOString(),
        }]);
        return;
      }

      // Stream SSE events
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'done') {
              setLogStatus(event.message === 'success' ? 'success' : 'error');
              if (event.message === 'success') {
                toast.success('FlowKraft AI Crew agents provisioned successfully!');
                await fetchAgents();
              } else {
                toast.error('Provisioning completed with errors');
              }
            } else if (event.type === 'result') {
              // Result JSON stored internally, not shown as log line
            } else {
              setLogLines(prev => [
                { type: event.type, message: event.message, ts: event.ts },
                ...prev,
              ]);
            }
          } catch {
            // ignore malformed SSE events
          }
        }
      }
    } catch (error) {
      console.error('Error provisioning agents:', error);
      toast.error('Failed to provision agents. Please check if Letta server is running.');
      setLogStatus('error');
      setLogLines(prev => [
        { type: 'error', message: 'Connection error: Failed to reach provisioning service', ts: new Date().toISOString() },
        ...prev,
      ]);
    } finally {
      setProvisioning(false);
    }
  };

  // Check if an agent is an alternative stack oracle (Next.js or WordPress)
  const isAlternativeOracle = (agent: Agent): boolean => {
    return agent.tags.some(tag => ALTERNATIVE_STACK_PREFIXES.some(prefix => tag.startsWith(prefix)));
  };

  // Check if an agent is Athena
  const isAthena = (agent: Agent): boolean => {
    return agent.name === 'Athena' || agent.tags.includes('reportburster');
  };

  // Get display description for an agent
  const getDescription = (agent: Agent): string => {
    return AGENT_DESCRIPTIONS[agent.name] || agent.description;
  };

  // Filter agents based on checkbox state
  const visibleAgents = showAlternatives
    ? agents
    : agents.filter(agent => !isAlternativeOracle(agent));

  const handleChatWithAgent = (agent: Agent) => {
    // Open Element Matrix with the agent's room
    const elementUrl = `http://localhost:8441/#/room/${encodeURIComponent(agent.matrixRoom)}`;
    window.open(elementUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShowInfo = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const renderLogPanel = () => {
    if (!showLogModal) return null;

    const headerBg =
      logStatus === 'success'
        ? 'bg-green-700'
        : logStatus === 'error'
          ? 'bg-red-700'
          : 'bg-slate-800';

    const StatusIcon =
      logStatus === 'success'
        ? CheckCircle2
        : logStatus === 'error'
          ? XCircle
          : Loader2;

    const handleCopy = () => {
      const text = [...logLines]
        .reverse()
        .map((l) => `[${l.ts}] [${l.type.toUpperCase()}] ${l.message}`)
        .join('\n');
      navigator.clipboard.writeText(text).then(() => toast.success('Logs copied to clipboard'));
    };

    const handleClose = () => {
      if (!provisioning) setShowLogModal(false);
    };

    return (
      <>
        {/* Semi-transparent overlay */}
        <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />

        {/* Log panel — right half (full width on mobile) */}
        <div id="log-panel" className="fixed right-0 top-0 bottom-0 w-full md:w-1/2 z-50 flex flex-col shadow-2xl">
          {/* Header bar */}
          <div className={`${headerBg} px-4 py-3 flex items-center justify-between text-white`}>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <StatusIcon className={`w-5 h-5 ${logStatus === 'running' ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Provisioning Logs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-white/20 hover:bg-white/30 transition-colors"
                title="Copy logs to clipboard"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                id="log-panel-close-button"
                onClick={handleClose}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-white/20 hover:bg-white/30 transition-colors ${
                  provisioning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={provisioning}
                title={provisioning ? 'Wait for provisioning to complete' : 'Close log panel'}
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>

          {/* Log content — newest first */}
          <div className="flex-1 bg-[#1e1e2e] overflow-y-auto p-4 font-mono text-sm">
            {logLines.length === 0 ? (
              <div className="text-gray-500 text-center mt-8">Waiting for logs...</div>
            ) : (
              logLines.map((line, i) => (
                <div
                  key={i}
                  className={`py-0.5 ${
                    line.type === 'error'
                      ? 'text-red-400'
                      : line.type === 'warn'
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-600 mr-2">
                    {new Date(line.ts).toLocaleTimeString()}
                  </span>
                  {line.message}
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
        {renderLogPanel()}
      </div>
    );
  }

  // Show provision button if no agents exist
  if (agents.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div id="agents-empty-state" className="text-center mb-12">
            <h1 id="agents-page-heading" className="text-4xl font-bold text-foreground mb-4">Welcome to AI Crew</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No agents found. Provision the FlowKraft AI Crew to get started.
            </p>
          </div>

          {/* Provision Button */}
          <div className="flex justify-center">
            <Button
              id="btn-provision-agents"
              size="lg"
              onClick={() => setShowProvisionConfirm(true)}
              disabled={provisioning}
              className="bg-rb-cyan hover:bg-rb-cyan/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {provisioning ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Provisioning... (60-120s)
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6 mr-3" />
                  Provision FlowKraft's AI Crew Agents
                </>
              )}
            </Button>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">Athena</h3>
              <p className="text-sm text-muted-foreground font-medium">ReportBurster Guru & Data Architect/Expert</p>
              <p className="text-xs text-muted-foreground mt-2">Get help mastering ReportBurster, designing data models, writing SQL, architecting business intelligence and reporting solutions</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">Hephaestus</h3>
              <p className="text-sm text-muted-foreground font-medium">Automation & Backend Expert</p>
              <p className="text-xs text-muted-foreground mt-2">Ask about scheduled jobs, ETL pipelines, cron automations, Groovy scripts, and backend integrations</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">Hermes</h3>
              <p className="text-sm text-muted-foreground font-medium">Grails Guru & Web Portal Expert</p>
              <p className="text-xs text-muted-foreground mt-2">Ask about building dashboards, admin panels, customer portals, and self-service web applications</p>
            </div>
          </div>

          {/* Requirements Note */}
          <div className="mt-8 bg-muted/50 border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-2">Requirements</h4>
            <p className="text-sm text-muted-foreground">
              Make sure you have <code className="bg-background px-2 py-1 rounded text-xs">OPENAI_API_KEY</code> and{' '}
              <code className="bg-background px-2 py-1 rounded text-xs">OPENAI_API_BASE</code> configured in your{' '}
              <code className="bg-background px-2 py-1 rounded text-xs">.env</code> file before provisioning.
            </p>
          </div>
        </div>

        {/* Provision Confirmation Dialog */}
        <Dialog open={showProvisionConfirm} onOpenChange={setShowProvisionConfirm}>
          <DialogContent id="dialog-provision-confirm" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Provision AI Crew?</DialogTitle>
              <DialogDescription>
                This will provision Athena, Hephaestus, Hermes, Apollo, and Pythia as your FlowKraft AI Crew agents. This may take 60-120 seconds. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                id="btn-provision-confirm-yes"
                onClick={() => {
                  setShowProvisionConfirm(false);
                  handleProvisionAgents();
                }}
                disabled={provisioning}
                className="bg-rb-cyan hover:bg-rb-cyan/90 text-white"
              >
                Yes, Provision Agents
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowProvisionConfirm(false)}
                disabled={provisioning}
              >
                No
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {renderLogPanel()}
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 id="agents-page-heading" className="text-3xl font-bold text-foreground mb-2">The Oracles of Ancient Greece</h1>
            <p className="text-muted-foreground">
              FlowKraft&apos;s council of AI oracles, each a master of their domain. Seek their counsel or explore their workspace.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap mt-2">
            <input
              type="checkbox"
              checked={showAlternatives}
              onChange={(e) => setShowAlternatives(e.target.checked)}
              className="rounded border-border text-rb-cyan focus:ring-rb-cyan cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">Show Next.js &amp; WordPress Oracles</span>
          </label>
        </div>
      </div>

      {/* Agents Table */}
      <div id="agents-table" className="max-w-7xl mx-auto mb-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground">
              <div className="col-span-12 sm:col-span-2">Name</div>
              <div className="hidden sm:block sm:col-span-4">Description</div>
              <div className="hidden md:block md:col-span-4">Tags</div>
              <div className="col-span-12 sm:col-span-2 text-right">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {visibleAgents.map((agent) => {
              const athena = isAthena(agent);
              const alternative = isAlternativeOracle(agent);
              return (
                <div
                  key={agent.id}
                  id={`agent-row-${agent.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors ${
                    athena ? 'bg-rb-cyan/5 border-l-2 border-l-rb-cyan' : ''
                  }`}
                >
                  {/* Name Column */}
                  <div className="col-span-12 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          athena
                            ? 'font-semibold text-foreground'
                            : 'font-normal text-foreground ml-3'
                        }`}
                      >
                        {agent.name}
                      </span>
                      {alternative && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          alt
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description Column */}
                  <div className="hidden sm:block sm:col-span-4">
                    <p className={`text-sm ${athena ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {getDescription(agent)}
                    </p>
                  </div>

                  {/* Tags Column (hidden on small screens) */}
                  <div className="hidden md:block md:col-span-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.tags
                        .filter(tag => !tag.startsWith('stack:'))
                        .map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rb-cyan/10 text-rb-cyan border border-rb-cyan/20"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowInfo(agent)}
                      className="text-muted-foreground hover:text-foreground"
                      title="View details"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleChatWithAgent(agent)}
                      className="bg-rb-cyan hover:bg-rb-cyan/90 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      Chat
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto flex gap-3">
        <Button
          id="btn-view-workspaces"
          variant="outline"
          size="lg"
          onClick={() => router.push('/workspaces')}
          className="border-rb-cyan text-rb-cyan hover:bg-rb-cyan hover:text-white"
        >
          <FolderOpen className="w-5 h-5 mr-2" />
          View Oracle Workspaces
        </Button>
        {/* Project dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            Projects
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          {projectDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      window.open('http://localhost:8442/?workspace=/workspaces/reportburster.code-workspace', '_blank', 'noopener,noreferrer');
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Code className="w-4 h-4 text-muted-foreground" />
                    <span className="text-card-foreground">ReportBurster</span>
                  </button>
                  <button
                    onClick={() => {
                      window.open('http://localhost:8442/?workspace=/workspaces/flowkraft-apps.code-workspace', '_blank', 'noopener,noreferrer');
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Code className="w-4 h-4 text-muted-foreground" />
                    <span className="text-card-foreground">Bkend/ETL Jobs & Frend Web Apps</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agent Info Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedAgent?.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 pt-4">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-foreground">{getDescription(selectedAgent)}</p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-rb-cyan/10 text-rb-cyan border border-rb-cyan/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matrix Room */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Matrix Room</h4>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {selectedAgent.matrixRoom}
                </code>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => {
                    handleChatWithAgent(selectedAgent);
                    setIsModalOpen(false);
                  }}
                  className="bg-rb-cyan hover:bg-rb-cyan/90 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with {selectedAgent.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog (Update Agents + API Provider tabs) */}
      <Dialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <DialogContent id="dialog-update-confirm" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className="sr-only">
              Configure agent updates and LLM API provider settings
            </DialogDescription>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex border-b border-border -mx-6 px-6">
            <button
              type="button"
              onClick={() => setSettingsTab('update')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                settingsTab === 'update'
                  ? 'border-rb-cyan text-rb-cyan'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Update Agents
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab('provider')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                settingsTab === 'provider'
                  ? 'border-rb-cyan text-rb-cyan'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              API Provider
            </button>
          </div>

          {/* Tab: Update Agents */}
          {settingsTab === 'update' && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                This will re-provision your AI crew agents. Existing agent configurations
                and memory blocks will be updated to match the latest definitions.
              </p>

              {/* Give db_query tool to Athena checkbox */}
              <label className="flex items-start gap-3 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giveDbQueryToolToAthena}
                  onChange={(e) => setGiveDbQueryToolToAthena(e.target.checked)}
                  className="mt-0.5 rounded border-border text-rb-cyan focus:ring-rb-cyan cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Give db_query tool to Athena</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When checked, Athena gets READ-ONLY access to query your
                    ReportBurster database connections.{' '}
                    <strong className="text-foreground">When unchecked, no AI agent
                    has any database access whatsoever.</strong>
                  </p>
                </div>
              </label>

              {/* Force checkbox */}
              <label className="flex items-start gap-3 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="mt-0.5 rounded border-border text-rb-cyan focus:ring-rb-cyan cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Force recreate</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delete and recreate all agents from scratch. Use this if agents are
                    in a broken state. All conversation history will be lost.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3 mt-4">
                <Button
                  id="btn-update-confirm-yes"
                  onClick={() => {
                    setShowUpdateConfirm(false);
                    handleProvisionAgents(forceUpdate, giveDbQueryToolToAthena);
                  }}
                  disabled={provisioning}
                  className="bg-rb-cyan hover:bg-rb-cyan/90 text-white"
                >
                  Yes, Update Agents
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateConfirm(false)}
                  disabled={provisioning}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tab: API Provider */}
          {settingsTab === 'provider' && (
            <LLMProviderForm
              fullConfig={llmConfig}
              onSave={async (newFullConfig) => {
                await setSetting(
                  SETTING_KEYS.LLM_PROVIDER,
                  JSON.stringify(newFullConfig),
                  'LLM API provider configuration'
                );
                setLlmConfig(newFullConfig);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {renderLogPanel()}
    </div>
  );
}
