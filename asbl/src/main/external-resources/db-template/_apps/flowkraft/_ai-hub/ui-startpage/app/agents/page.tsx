'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info, Code, Rocket, Loader2, ChevronDown, Bug } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Stack options for the Web Apps Stack selector
const STACK_OPTIONS = [
  { value: 'grails', label: 'Grails (Recommended)', stackTag: 'stack:grails' },
  { value: 'nextjs', label: 'Next.js', stackTag: 'stack:nextjs' },
] as const;

type StackValue = typeof STACK_OPTIONS[number]['value'];

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [selectedStack, setSelectedStack] = useState<StackValue>('grails');
  const [stackLoading, setStackLoading] = useState(true);

  // Fetch stack config from database
  useEffect(() => {
    const fetchStackConfig = async () => {
      try {
        const response = await fetch('/api/config?key=webapp_stack');
        const data = await response.json();
        if (data.success && data.config) {
          setSelectedStack(data.config.value as StackValue);
        }
      } catch (error) {
        console.error('Error fetching stack config:', error);
        // Keep default 'grails' on error
      } finally {
        setStackLoading(false);
      }
    };
    fetchStackConfig();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success && data.agents.length > 0) {
        // Map Letta agents to our format
        const mappedAgents = data.agents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          tags: agent.tags || [],
          description: agent.system || 'No description available',
          whenToUse: 'Contact this agent for assistance',
          matrixRoom: `@${agent.name.toLowerCase().replace(/\s+/g, '-')}:localhost`,
        }));
        setAgents(mappedAgents);
      } else {
        // No agents found - show sample data for now
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

  const handleProvisionAgents = async (force: boolean = true) => {
    try {
      setProvisioning(true);
      const response = await fetch('/api/agents/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('FlowKraft AI Crew agents provisioned successfully! 🎉');
        // Refresh agents list
        await fetchAgents();
      } else {
        // Check if env variables are missing
        if (data.missing && data.missing.length > 0) {
          toast.error(
            `Missing required environment variables: ${data.missing.join(', ')}. Please add them to your .env file, restart the app, and try again.`,
            {
              duration: 8000,
            }
          );
        } else {
          toast.error(data.message || 'Failed to provision agents');
        }
      }
    } catch (error) {
      console.error('Error provisioning agents:', error);
      toast.error('Failed to provision agents. Please check if Letta server is running.');
    } finally {
      setProvisioning(false);
    }
  };

  const handleStackChange = async (newStack: StackValue) => {
    const previousStack = selectedStack;
    setSelectedStack(newStack); // Optimistic update

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'webapp_stack',
          value: newStack,
          description: 'Selected web application stack for the project',
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Stack changed to ${STACK_OPTIONS.find(s => s.value === newStack)?.label}`);
      } else {
        throw new Error(data.error || 'Failed to save stack');
      }
    } catch (error) {
      console.error('Error saving stack config:', error);
      setSelectedStack(previousStack); // Rollback on error
      toast.error('Failed to save stack preference');
    }
  };

  // Helper to check if an agent matches the selected stack
  const isStackAgent = (agent: Agent): boolean => {
    const stackOption = STACK_OPTIONS.find(s => s.value === selectedStack);
    return stackOption ? agent.tags.includes(stackOption.stackTag) : false;
  };

  const handleChatWithAgent = (agent: Agent) => {
    // Open Element Matrix with the agent's room
    const elementUrl = `http://localhost:8090/#/room/${encodeURIComponent(agent.matrixRoom)}`;
    window.open(elementUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShowInfo = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleCodeWithClaude = () => {
    // Open Code Server
    window.open('http://localhost:8443', '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  // Show provision button if no agents exist
  if (agents.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to AI Crew</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No agents found. Provision the FlowKraft AI Crew to get started with Athena, Hephaestus, and Hermes.
            </p>
          </div>

          {/* Provision Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => handleProvisionAgents()}
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
              <h3 className="font-semibold text-foreground mb-2">🦉 Athena</h3>
              <p className="text-sm text-muted-foreground font-medium">ReportBurster Guru & Data Expert</p>
              <p className="text-xs text-muted-foreground mt-2">Ask about ReportBurster features, SQL queries, data modeling, database connections, and reporting solutions</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">🔨 Hephaestus</h3>
              <p className="text-sm text-muted-foreground font-medium">Automation & Backend Architect</p>
              <p className="text-xs text-muted-foreground mt-2">Ask about scheduled jobs, ETL pipelines, cron automations, Groovy scripts, and backend integrations</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">🪽 Hermes</h3>
              <p className="text-sm text-muted-foreground font-medium">Web Apps & Portal Builder</p>
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
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Agents</h1>
          <p className="text-muted-foreground">
            Manage and interact with your AI crew. Click on an agent to chat or view details.
          </p>
        </div>

        {/* Re-provision Button (only shown when agents exist) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpdateConfirm(true)}
          disabled={provisioning}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-rb-cyan"
          title="Update agents (re-provision without force)"
        >
          {provisioning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Update Agents
            </>
          )}
        </Button>
      </div>

      {/* Web Apps Stack Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="stack-select" className="text-sm font-medium text-foreground whitespace-nowrap">
              Web Apps Stack:
            </label>
            <div className="relative">
              <select
                id="stack-select"
                value={selectedStack}
                onChange={(e) => handleStackChange(e.target.value as StackValue)}
                disabled={stackLoading}
                className="appearance-none bg-background border border-border rounded-md px-4 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rb-cyan focus:border-rb-cyan disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {STACK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <span className="text-xs text-muted-foreground">
              Agents with expertise in the selected stack will be highlighted
            </span>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-muted/50 px-6 py-3 border-b border-border font-semibold text-sm text-muted-foreground">
            <div className="col-span-12 sm:col-span-3">Name</div>
            <div className="hidden sm:block sm:col-span-3">Tags</div>
            <div className="hidden md:block md:col-span-4">When to Use</div>
            <div className="col-span-12 sm:col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {agents.map((agent) => {
              const isHighlighted = isStackAgent(agent);
              return (
                <div
                  key={agent.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors ${
                    isHighlighted ? 'bg-rb-cyan/5 border-l-2 border-l-rb-cyan' : ''
                  }`}
                >
                  {/* Name Column */}
                  <div className="col-span-12 sm:col-span-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="font-semibold text-foreground hover:text-rb-cyan hover:underline transition-colors"
                      >
                        {agent.name}
                      </Link>
                      {isHighlighted && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rb-cyan text-white uppercase tracking-wider">
                          {selectedStack}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground sm:hidden mt-1">
                      {agent.tags.join(', ')}
                    </div>
                  </div>

                {/* Tags Column (hidden on mobile) */}
                <div className="hidden sm:block sm:col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rb-cyan/10 text-rb-cyan border border-rb-cyan/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* When to Use Column (hidden on small screens) */}
                <div className="hidden md:block md:col-span-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.whenToUse}
                  </p>
                </div>

                {/* Actions Column */}
                <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/agents/${agent.id}/debug`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-muted-foreground"
                    title="Debug agent"
                  >
                    <Bug className="w-4 h-4" />
                  </Link>
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
                    Chat with {agent.name}
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Code with Claude Button */}
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          size="lg"
          onClick={handleCodeWithClaude}
          className="border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Code className="w-5 h-5 mr-2" />
          Code with Claude
        </Button>
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

              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-foreground">{selectedAgent.description}</p>
              </div>

              {/* When to Use */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">When to Use</h4>
                <p className="text-foreground">{selectedAgent.whenToUse}</p>
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

      {/* Update Agents Confirmation Dialog */}
      <Dialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Agents?</DialogTitle>
            <DialogDescription>
              This will re-provision your AI crew agents (Athena, Hephaestus, Hermes) without forcing recreation.
              Existing agent configurations will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUpdateConfirm(false)}
              disabled={provisioning}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowUpdateConfirm(false);
                handleProvisionAgents(false);
              }}
              disabled={provisioning}
              className="bg-rb-cyan hover:bg-rb-cyan/90 text-white"
            >
              Yes, Update Agents
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
