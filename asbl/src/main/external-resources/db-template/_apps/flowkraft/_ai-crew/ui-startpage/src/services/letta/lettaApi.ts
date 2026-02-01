import Letta from '@letta-ai/letta-client';
import type {
  LettaAgent,
  LettaMessage,
  Project,
  ListProjectsParams,
  ListProjectsResponse,
  ListAgentsParams,
  ListMessagesParams,
  CreateAgentRequest,
  SendMessageRequest,
  SendMessageResponse,
  StreamingChunk,
  ApiError,
  MemoryBlock,
  Passage,
  ListPassagesParams,
  CreatePassageRequest,
  SearchPassagesParams,
  SearchPassagesResponse
} from '../../model/letta-model';
import { Platform, lettaConfig } from '../../utils/constants';

class LettaApiService {
  private client: Letta | null = null;
  private token: string | null = null;

  constructor(token?: string) {
    if (token) {
      this.setAuthToken(token);
    }
  }

  async listAgentBlocks(agentId: string): Promise<MemoryBlock[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      const blocksPage = await this.client.agents.blocks.list(agentId);
      const blocks = blocksPage.items || [];
      return blocks as unknown as MemoryBlock[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createBlock(block: { label: string; value: string; description?: string; limit?: number }): Promise<MemoryBlock> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      const createdBlock = await this.client.blocks.create(block);
      return createdBlock as unknown as MemoryBlock;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async attachBlockToAgent(agentId: string, blockId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      await this.client.agents.blocks.attach(blockId, { agent_id: agentId });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAgentBlock(agentId: string, block: { label: string; value: string; description?: string; limit?: number }): Promise<MemoryBlock> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      // Create the block first
      const createdBlock = await this.client.blocks.create(block);
      // Then attach it to the agent
      await this.client.agents.blocks.attach(createdBlock.id, { agent_id: agentId });
      return createdBlock as unknown as MemoryBlock;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  setAuthToken(token: string): void {
    // Initialize the official Letta client with extended timeout for agent creation
    // Agent creation with sleeptime can take a while as it creates 2 agents
    this.client = new Letta({
      apiKey: token,
      baseURL: lettaConfig.api.baseURL,
      timeout: lettaConfig.api.timeout
    });
    this.token = token;
    // logger.debugdebug('Auth token set, client initialized');
  }

  removeAuthToken(): void {
    this.client = null;
    this.token = null;
  }

  isAuthenticated(): boolean {
    return this.client !== null;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.agents.list({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Projects API is not exposed in the TypeScript SDK (REST only)
  async listProjects(_params: ListProjectsParams = {}): Promise<ListProjectsResponse> {
    throw new Error('Projects API is not available in the TypeScript SDK. Use REST API directly.');
  }

  // Projects API is not exposed in the TypeScript SDK (REST only)
  async getProjectById(_projectId: string): Promise<Project | null> {
    throw new Error('Projects API is not available in the TypeScript SDK. Use REST API directly.');
  }

  async listAgents(params?: ListAgentsParams): Promise<LettaAgent[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      
      // logger.debugdebug('listAgents - params:', params);

      const responsePage = await this.client.agents.list(params);
      const response = responsePage.items || [];
      // logger.debugdebug('listAgents - response count:', response.length);

      return response as unknown as LettaAgent[];
    } catch (error) {
      // logger.debugerror('listAgents - error:', error);
      throw this.handleError(error);
    }
  }

  async listAgentsForProject(projectId: string, params: Omit<ListAgentsParams, 'projectId'> = {}): Promise<LettaAgent[]> {
    try {
      const enhancedParams: ListAgentsParams = {
        ...params,
        projectId: projectId,
        sortBy: params.sortBy || 'last_run_completion'
      };

      // logger.debugdebug('listAgentsForProject - projectId:', projectId);

      const result = await this.listAgents(enhancedParams);
      // logger.debugdebug('listAgentsForProject - result count:', result?.length || 0);

      return result;
    } catch (error) {
      // logger.debugerror('listAgentsForProject - error:', error);
      throw this.handleError(error);
    }
  }

  async findAgentByTags(tags: string[]): Promise<LettaAgent | null> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // logger.debugdebug('findAgentByTags - searching for tags:', tags);

      const agents = await this.listAgents({
        tags,
        matchAllTags: true,
        limit: 1
      });

      // logger.debugdebug('findAgentByTags - found agents:', agents.length);

      return agents.length > 0 ? agents[0] : null;
    } catch (error) {
      // logger.debugerror('findAgentByTags - error:', error);
      throw this.handleError(error);
    }
  }

  async getAgent(agentId: string): Promise<LettaAgent> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      
      // SDK uses `retrieve` for fetching a single agent
      const response = await this.client.agents.retrieve(agentId);
      return response as unknown as LettaAgent;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAgent(agentData: CreateAgentRequest): Promise<LettaAgent> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      
      const response = await this.client.agents.create(agentData);
      return response as unknown as LettaAgent;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      
      await this.client.agents.delete(agentId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessage(agentId: string, messageData: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // logger.debugdebug('sendMessage - agentId:', agentId);

      const lettaRequest = {
        messages: messageData.messages.map(msg => {
          // Only use array format for multimodal content (images)
          // Use string format for text-only messages
          const content = Array.isArray(msg.content) ? msg.content : msg.content;

          return {
            role: msg.role,
            content: content
          };
        }),
        max_steps: messageData.max_steps,
        use_assistant_message: messageData.use_assistant_message,
        enable_thinking: messageData.enable_thinking ? 'true' : undefined
      };

      const response = await this.client.agents.messages.create(agentId, lettaRequest as any);
      
      // Transform messages to match our interface, preserving tool step types
      const transformedMessages = (response.messages || []).map((message: any) => {
        const type = message.message_type || message.messageType;
        // Extract possible tool call/return shapes from SDK variants
        const toolCall = message.tool_call || message.toolCall || (message.tool_calls && message.tool_calls[0]);
        const toolReturn = message.tool_response || message.toolResponse || message.tool_return || message.toolReturn;

        // Default role mapping
        let role: 'user' | 'assistant' | 'system' | 'tool' = 'assistant';
        if (type === 'user_message') {
          role = 'user';
        } else if (type === 'system_message') {
          role = 'system';
        } else if (type === 'assistant_message' || type === 'reasoning_message') {
          role = 'assistant';
        } else if (type === 'tool_call' || type === 'tool_call_message' || type === 'tool_response' || type === 'tool_return_message' || type === 'tool_message') {
          // Preserve tool role for tool steps
          role = 'tool';
        }

        // Prefer original content; downstream UI will render tool steps into readable lines when needed
        const content: string = message.content || message.reasoning || '';

        return {
          id: message.id,
          role,
          content,
          created_at: message.date ? (typeof message.date === 'string' ? message.date : message.date.toISOString()) : new Date().toISOString(),
          tool_calls: message.tool_calls,
          message_type: type,
          sender_id: message.senderId,
          step_id: message.stepId,
          run_id: message.runId,
          // Pass through tool details for UI reassembly
          tool_call: toolCall,
          tool_response: toolReturn,
        };
      });
      
      return {
        messages: transformedMessages,
        stop_reason: response.stop_reason as unknown as SendMessageResponse['stop_reason'],
        usage: response.usage as SendMessageResponse['usage']
      };
    } catch (error) {
      // logger.debugerror('sendMessage - error:', error);
      throw this.handleError(error);
    }
  }

  async sendMessageStream(
    agentId: string,
    messageData: SendMessageRequest,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete: (response: SendMessageResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // logger.debugdebug('sendMessageStream - agentId:', agentId);

      // Build streaming request following docs format exactly
      const lettaStreamingRequest: any = {
        messages: messageData.messages.map(msg => {
          // Only use array format for multimodal content (images)
          // Use string format for text-only messages
          const content = Array.isArray(msg.content) ? msg.content : msg.content;

          return {
            type: "message",  // Required by SDK v1.0
            role: msg.role,
            content: content
          };
        }),
        // Token streaming provides partial chunks for real-time UX
        // NOTE: Disabled on React Native (Android/iOS) - Web Streams API not supported
        stream_tokens: Platform.OS === 'web' && messageData.stream_tokens !== false,
        // Background mode prevents client-side terminations and enables resumption
        background: true,
        // Ping events keep connection alive during long operations
        // NOTE: Temporarily disabled to match letta-code example
        // include_pings: true,
      };

      // Only add optional params if they're defined
      if (messageData.max_steps !== undefined) {
        lettaStreamingRequest.max_steps = messageData.max_steps;
      }

      const stream = await this.client.agents.messages.stream(agentId, lettaStreamingRequest);

      // Handle the stream response using async iteration
      try {
        for await (const chunk of stream) {
          onChunk({
            message_type: (chunk as any).message_type || (chunk as any).messageType,
            content: (chunk as any).assistant_message || (chunk as any).assistantMessage || (chunk as any).content,
            reasoning: (chunk as any).reasoning || (chunk as any).hiddenReasoning,
            tool_call: (chunk as any).tool_call || (chunk as any).toolCall,
            tool_response: (chunk as any).tool_response || (chunk as any).toolResponse || (chunk as any).toolReturn,
            step: (chunk as any).step || (chunk as any).stepId,
            run_id: (chunk as any).run_id || (chunk as any).runId,
            seq_id: (chunk as any).seq_id || (chunk as any).seqId,
            id: (chunk as any).id || (chunk as any).message_id || (chunk as any).messageId
          });
        }
        
        // Stream completed successfully
        onComplete({
          messages: [],
          usage: undefined
        });
      } catch (streamError) {
        // logger.debugerror('Stream iteration error:', streamError);
        onError(this.handleError(streamError));
      }
    } catch (error) {
      // logger.debugerror('sendMessageStream setup error:', error);
      onError(this.handleError(error));
    }
  }

  // runs.active is not available in the current SDK version
  async getActiveRuns(_agentIds: string[]): Promise<unknown[]> {
    throw new Error('getActiveRuns is not available in the current SDK version.');
  }

  // runs.stream is not available in the current SDK version
  async resumeStream(
    _runId: string,
    _startingAfter: number,
    _onChunk: (chunk: StreamingChunk) => void,
    _onComplete: (response: SendMessageResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    onError(new Error('resumeStream is not available in the current SDK version.'));
  }

  async listMessages(agentId: string, params?: ListMessagesParams): Promise<LettaMessage[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // logger.debugdebug('listMessages - agentId:', agentId);

      const responsePage = await this.client.agents.messages.list(agentId, params);
      const response = responsePage.items || [];

      /**
       * MESSAGE TRANSFORMATION ARCHITECTURE
       *
       * This transformation is intentionally simple: we return ALL messages from the API
       * without filtering, grouping, or combining them. The UI handles rendering based on
       * message_type. This prevents data loss and keeps the logic maintainable.
       *
       * CRITICAL: API Message Structure
       *
       * The Letta API returns messages with different structures based on message_type:
       *
       * 1. TOOL CALL MESSAGES (type: 'tool_call_message')
       *    - message.content: Often EMPTY or null
       *    - message.tool_call: { name: string, arguments: string (JSON) }
       *    - We MUST construct content from tool_call.name + tool_call.arguments
       *    - Example: tool_call = { name: "memory_replace", arguments: "{\"label\":\"you\"...}" }
       *      → content = "memory_replace({\"label\":\"you\"...})"
       *
       * 2. TOOL RETURN MESSAGES (type: 'tool_return_message')
       *    - message.content: Often EMPTY or null
       *    - message.tool_return: string | { tool_return: string }
       *    - We MUST extract content from tool_return field
       *    - Example: tool_return = "The core memory block has been edited"
       *      → content = "The core memory block has been edited"
       *
       * 3. ASSISTANT/REASONING MESSAGES (type: 'assistant_message' | 'reasoning_message')
       *    - message.content: Contains the actual text
       *    - No special handling needed
       *
       * 4. USER/SYSTEM MESSAGES (type: 'user_message' | 'system_message')
       *    - message.content: Contains the actual text
       *    - No special handling needed
       *
       * WHY THIS MATTERS:
       * If we don't construct content from tool_call/tool_return fields, tool messages will
       * display as empty blocks like "tool({})" which is meaningless to the user.
       */
      const transformedMessages: LettaMessage[] = response.map((message: any) => {
        const type = (message.message_type || message.messageType) as string;

        // Extract tool call/return data (try multiple field name variants for SDK compatibility)
        const toolCall = message.tool_call || message.toolCall || (message.tool_calls && message.tool_calls[0]);
        const toolReturn = message.tool_response || message.toolResponse || message.tool_return || message.toolReturn;

        // Map message type to role
        let role: 'user' | 'assistant' | 'system' | 'tool' = 'assistant';
        if (type === 'user_message') {
          role = 'user';
        } else if (type === 'system_message') {
          role = 'system';
        } else if (type === 'assistant_message' || type === 'reasoning_message') {
          role = 'assistant';
        } else if (type === 'tool_call' || type === 'tool_call_message' || type === 'tool_response' || type === 'tool_return_message' || type === 'tool_message') {
          role = 'tool';
        }

        // Start with content from API (may be empty for tool messages)
        let content: string = message.content || message.reasoning || '';

        // CONSTRUCT content for tool call messages (if content is empty)
        if ((type === 'tool_call_message' || type === 'tool_call') && !content && toolCall) {
          const { formatToolCall } = require('../utils/formatToolCall');
          const name = toolCall.name || 'tool';
          const args = toolCall.arguments || '{}';
          content = formatToolCall(name, args);
        }

        // EXTRACT content for tool return messages (if content is empty)
        if ((type === 'tool_return_message' || type === 'tool_response') && !content && toolReturn) {
          content = typeof toolReturn === 'string' ? toolReturn : (toolReturn.tool_return || toolReturn.content || '');
        }

        return {
          id: message.id,
          role,
          content,
          created_at: message.date ? (typeof message.date === 'string' ? message.date : message.date.toISOString()) : new Date().toISOString(),
          tool_calls: message.tool_calls,
          message_type: type,
          sender_id: message.senderId,
          step_id: message.stepId || message.step_id,
          run_id: message.runId,
          tool_call: toolCall,
          tool_response: toolReturn,
          // For reasoning messages, store reasoning
          reasoning: type === 'reasoning_message' ? (message.reasoning || message.content) : undefined,
        };
      });

      // logger.debugdebug('listMessages - count:', transformedMessages.length);
      return transformedMessages;
    } catch (error) {
      // logger.debugerror('listMessages - error:', error);
      throw this.handleError(error);
    }
  }

  async listTools(params?: { name?: string; names?: string[] }): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const responsePage = await this.client.tools.list(params);
      return responsePage.items || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listModels(): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      
      // Fetch raw models from SDK (shape can vary between SDK versions)
      const response = await this.client.models?.list?.() || [];

      // Normalize to a consistent shape expected by the app
      const normalizeProvider = (raw: any, modelName?: string): string | undefined => {
        const direct = raw?.provider_name || raw?.provider || raw?.vendor || raw?.providerName;
        if (direct) return String(direct);
        const name = modelName || raw?.model || raw?.name || raw?.id;
        if (!name || typeof name !== 'string') return undefined;
        const lower = name.toLowerCase();
        if (lower.includes('gpt') || lower.startsWith('o3') || lower.startsWith('o4')) return 'openai';
        if (lower.includes('claude')) return 'anthropic';
        if (lower.includes('gemini') || lower.startsWith('g') && lower.includes('flash')) return 'google_ai';
        if (lower.includes('letta')) return 'letta';
        if (lower.includes('llama') || lower.includes('mistral') || lower.includes('mixtral')) return 'together';
        return undefined;
      };

      const normalize = (raw: any) => {
        const modelName = raw?.model || raw?.name || (typeof raw?.id === 'string' ? raw.id.split('/').pop() : undefined);
        const provider = normalizeProvider(raw, modelName);
        const contextWindow = raw?.context_window || raw?.contextWindow || raw?.max_context || raw?.maxContext || raw?.context || 0;
        const endpointType = raw?.model_endpoint_type || raw?.endpoint_type || raw?.type || raw?.modelType || 'chat';
        return {
          model: modelName,
          provider_name: provider,
          context_window: contextWindow,
          model_endpoint_type: endpointType,
          // pass through optional known fields if present
          temperature: raw?.temperature,
          max_tokens: raw?.max_tokens || raw?.maxTokens,
          // include original for debugging if needed by callers
          _raw: raw,
        } as any;
      };

      const normalized = Array.isArray(response) ? response.map(normalize).filter(m => !!m.model) : [];
      return normalized;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Approve or deny an approval request
  async approveToolRequest(
    agentId: string,
    params: { approval_request_id: string; approve: boolean; reason?: string }
  ): Promise<SendMessageResponse> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const requestBody: any = {
        messages: [
          {
            type: 'approval',
            approve: params.approve,
            approvalRequestId: params.approval_request_id,
            reason: params.reason,
          },
        ],
      };

      // Defensive sanitize to avoid accidental union-conflicting keys
      const sanitized: any = JSON.parse(JSON.stringify(requestBody));
      delete sanitized.group_id; delete sanitized.groupId;
      if (Array.isArray(sanitized.messages)) {
        sanitized.messages = sanitized.messages.map((m: any) => {
          const { group_id, groupId, ...rest } = m || {};
          return rest;
        });
      }

      try {
        const response = await this.client.agents.messages.create(agentId, sanitized);
        const transformedMessages = (response.messages || []).map((message: any) => {
          const type = message.message_type || message.messageType;
          const toolCall = message.tool_call || message.toolCall || (message.tool_calls && message.tool_calls[0]);
          const toolReturn = message.tool_response || message.toolResponse || message.tool_return || message.toolReturn;

          let role: 'user' | 'assistant' | 'system' | 'tool' = 'assistant';
          if (type === 'user_message') role = 'user';
          else if (type === 'system_message') role = 'system';
          else if (type === 'tool_call' || type === 'tool_call_message' || type === 'tool_response' || type === 'tool_return_message' || type === 'tool_message') role = 'tool';

          const content: string = message.content || message.reasoning || '';

          return {
            id: message.id,
            role,
            content,
            created_at: message.date ? (typeof message.date === 'string' ? message.date : message.date.toISOString()) : new Date().toISOString(),
            tool_calls: message.tool_calls,
            message_type: type,
            sender_id: message.senderId,
            step_id: message.stepId,
            run_id: message.runId,
            tool_call: toolCall,
            tool_response: toolReturn,
          } as LettaMessage;
        });

        return {
          messages: transformedMessages,
          stop_reason: (response as any).stopReason,
          usage: (response as any).usage,
        };
      } catch (sdkErr: any) {
        // If the server complains about group_id on ApprovalCreate, retry with raw fetch and minimal body
        const bodyStr = sdkErr?.body ? JSON.stringify(sdkErr.body) : '';
        if (sdkErr?.statusCode === 400 && /ApprovalCreate/.test(bodyStr) && /group_id/.test(bodyStr) && this.token) {
          const raw = {
            messages: [
              {
                type: 'approval',
                approve: params.approve,
                approval_request_id: params.approval_request_id,
                ...(params.reason ? { reason: params.reason } : {}),
              },
            ],
          } as any;
          const resp = await fetch(`https://api.letta.com/v1/agents/${encodeURIComponent(agentId)}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify(raw),
          });
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Approval POST failed: ${resp.status} ${txt}`);
          }
          const json = await resp.json();
          const transformedMessages = (json.messages || []).map((message: any) => {
            const type = message.message_type || message.messageType;
            const toolCall = message.tool_call || message.toolCall || (message.tool_calls && message.tool_calls[0]);
            const toolReturn = message.tool_response || message.toolResponse || message.tool_return || message.toolReturn;

            let role: 'user' | 'assistant' | 'system' | 'tool' = 'assistant';
            if (type === 'user_message') role = 'user';
            else if (type === 'system_message') role = 'system';
            else if (type === 'tool_call' || type === 'tool_call_message' || type === 'tool_response' || type === 'tool_return_message' || type === 'tool_message') role = 'tool';

            const content: string = message.content || message.reasoning || '';
            return {
              id: message.id,
              role,
              content,
              created_at: message.date ? (typeof message.date === 'string' ? message.date : message.date.toISOString()) : new Date().toISOString(),
              tool_calls: message.tool_calls,
              message_type: type,
              sender_id: message.senderId,
              step_id: message.stepId,
              run_id: message.runId,
              tool_call: toolCall,
              tool_response: toolReturn,
            } as LettaMessage;
          });
          return {
            messages: transformedMessages,
            stop_reason: json.stop_reason || json.stopReason,
            usage: json.usage,
          };
        }
        throw sdkErr;
      }
    } catch (error) {
      // logger.debugerror('approveToolRequest - error:', error);
      throw this.handleError(error);
    }
  }

  // Approve/deny via streaming endpoint (background mode)
  async approveToolRequestStream(
    agentId: string,
    params: { approval_request_id: string; approve: boolean; reason?: string },
    onChunk?: (chunk: StreamingChunk) => void,
    onComplete?: (response: SendMessageResponse) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const body: any = {
        messages: [
          {
            type: 'approval',
            approve: params.approve,
            approval_request_id: params.approval_request_id,
            reason: params.reason,
          },
        ],
        // NOTE: Disabled on React Native (Android/iOS) - Web Streams API not supported
        stream_tokens: Platform.OS === 'web',
        background: true,
        include_pings: true,
      };

      const stream = await this.client.agents.messages.stream(agentId, body);

      for await (const chunk of stream) {
        const mt = (chunk as any).message_type || (chunk as any).messageType;
        const mapped: StreamingChunk = {
          message_type: mt,
          content: (chunk as any).assistant_message || (chunk as any).assistantMessage || (chunk as any).content,
          reasoning: (chunk as any).reasoning,
          tool_call: (chunk as any).tool_call,
          tool_response: (chunk as any).tool_response || (chunk as any).toolReturn,
          step: (chunk as any).step,
          run_id: (chunk as any).run_id || (chunk as any).runId,
          seq_id: (chunk as any).seq_id || (chunk as any).seqId,
          id: (chunk as any).id || (chunk as any).message_id || (chunk as any).messageId,
        };
        onChunk?.(mapped);

        // Close early when we receive the approval response or initial tool result
        if (mt === 'approval_response_message' || mt === 'tool_return_message') {
          onComplete?.({ messages: [], usage: undefined });
          return; // stop awaiting the stream so UI can resume
        }
      }

      // Fallback: if stream ends without explicit response, still complete
      onComplete?.({ messages: [], usage: undefined });
    } catch (err) {
      onError?.(this.handleError(err));
    }
  }

  async listEmbeddingModels(): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // Note: SDK shapes can vary; apply same normalization basics
      const response = await this.client.models?.embeddings?.list?.() || [];
      const normalized = Array.isArray(response)
        ? response.map((raw: any) => {
            const modelName = raw?.embedding_model || raw?.model || raw?.name || raw?.id;
            const provider = raw?.provider_name || raw?.provider || raw?.vendor;
            return {
              model: modelName,
              provider_name: provider,
              context_window: raw?.context_window || raw?.contextWindow || 0,
              model_endpoint_type: raw?.embedding_endpoint_type || raw?.endpoint_type || 'embedding',
              _raw: raw,
            } as any;
          }).filter((m: any) => !!m.model)
        : [];
      return normalized;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Folder management
  async listFolders(params?: { name?: string }): Promise<any[]> {
    try {
      if (!this.client || !this.token) {
        throw new Error('Client not initialized. Please set auth token first.');
      }
      // If searching by name, paginate through SDK to find it
      if (params?.name) {
        // logger.debugdebug('listFolders - searching for folder:', params.name);
        let allFolders: any[] = [];
        let after: string | undefined = undefined;
        let pageCount = 0;
        const maxPages = 20; // Safety limit

        do {
          const page = await this.client.folders.list({
            limit: 50,
            ...(after && { after })
          });

          // SDK v1.0 returns page object with .items
          const folders = page.items || [];
          allFolders = allFolders.concat(folders);
          pageCount++;

          // Stop if we found the folder we're looking for
          const found = folders.find(f => f.name === params.name);
          if (found) {
            return [found];
          }

          // Check if there are more pages
          if (folders.length < 50) {
            after = undefined;
          } else {
            after = folders[folders.length - 1]?.id;
          }

        } while (after && pageCount < maxPages);

        // logger.debugdebug('listFolders - folder not found:', params.name);
        return [];
      }

      // No name filter, just return first page using SDK
      const foldersPage = await this.client.folders.list(params);
      const folders = foldersPage.items || [];
      return folders;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createFolder(name: string, description?: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // Cloud API doesn't allow embedding config
      const folder = await this.client.folders.create({
        name,
        description
      });

      return folder;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadFileToFolder(folderId: string, file: File, duplicateHandling: 'skip' | 'error' | 'suffix' | 'replace' = 'replace'): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // The SDK upload method signature might vary - try direct API call
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://api.letta.com/v1/folders/${folderId}/upload?duplicate_handling=${duplicateHandling}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // jobs API is not available in the current SDK version
  async getJobStatus(_jobId: string): Promise<unknown> {
    throw new Error('getJobStatus is not available in the current SDK version.');
  }

  async listFolderFiles(folderId: string): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const filesPage = await this.client.folders.files.list(folderId);
      return filesPage.items || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteFile(folderId: string, fileId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.folders.files.delete(fileId, { folder_id: folderId });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async attachFolderToAgent(agentId: string, folderId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.agents.folders.attach(folderId, { agent_id: agentId });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async detachFolderFromAgent(agentId: string, folderId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.agents.folders.detach(folderId, { agent_id: agentId });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async closeAllFiles(agentId: string): Promise<string[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const result = await this.client.agents.files.closeAll(agentId);
      return result;
    } catch (error) {
      // logger.debugerror('closeAllFiles - error:', error);
      throw this.handleError(error);
    }
  }

  // Archives API
  async createArchive(name: string, description?: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const archive = await this.client.archives.create({
        name,
        description: description || undefined,
      });
      return archive;
    } catch (error) {
      // logger.debugerror('createArchive - error:', error);
      throw this.handleError(error);
    }
  }

  async listArchives(): Promise<any[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const archivesPage = await this.client.archives.list();
      return archivesPage.items || [];
    } catch (error) {
      // logger.debugerror('listArchives - error:', error);
      throw this.handleError(error);
    }
  }

  async getArchive(archiveId: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const archive = await this.client.archives.retrieve(archiveId);
      return archive;
    } catch (error) {
      // logger.debugerror('getArchive - error:', error);
      throw this.handleError(error);
    }
  }

  async attachArchiveToAgent(agentId: string, archiveId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.agents.archives.attach(archiveId, { agent_id: agentId });
    } catch (error) {
      // logger.debugerror('attachArchiveToAgent - error:', error);
      throw this.handleError(error);
    }
  }

  async detachArchiveFromAgent(agentId: string, archiveId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.agents.archives.detach(archiveId, { agent_id: agentId });
    } catch (error) {
      // logger.debugerror('detachArchiveFromAgent - error:', error);
      throw this.handleError(error);
    }
  }

  // Archival Memory (Passages) API
  async listPassages(agentId: string, params?: ListPassagesParams): Promise<Passage[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const passages = await this.client.agents.passages.list(agentId, params);
      return passages as Passage[];
    } catch (error) {
      // logger.debugerror('listPassages - error:', error);
      throw this.handleError(error);
    }
  }

  async createPassage(agentId: string, data: CreatePassageRequest): Promise<Passage[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const result = await this.client.agents.passages.create(agentId, data);
      return result as Passage[];
    } catch (error) {
      // logger.debugerror('createPassage - error:', error);
      throw this.handleError(error);
    }
  }

  async searchPassages(agentId: string, params: SearchPassagesParams): Promise<SearchPassagesResponse> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const result = await this.client.agents.passages.search(agentId, params);
      return result as SearchPassagesResponse;
    } catch (error) {
      // logger.debugerror('searchPassages - error:', error);
      throw this.handleError(error);
    }
  }

  async deletePassage(agentId: string, passageId: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      await this.client.agents.passages.delete(passageId, { agent_id: agentId });
    } catch (error) {
      // logger.debugerror('deletePassage - error:', error);
      throw this.handleError(error);
    }
  }

  // passages.modify is not available in the current SDK version
  async modifyPassage(_agentId: string, _passageId: string, _data: Partial<CreatePassageRequest>): Promise<Passage> {
    throw new Error('modifyPassage is not available in the current SDK version.');
  }

  async attachToolToAgent(agentId: string, toolId: string): Promise<LettaAgent> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const result = await this.client.agents.tools.attach(toolId, { agent_id: agentId });
      return result as unknown as LettaAgent;
    } catch (error) {
      // logger.debugerror('attachToolToAgent - error:', error);
      throw this.handleError(error);
    }
  }

  async attachToolToAgentByName(agentId: string, toolName: string): Promise<LettaAgent> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      // Find the tool by name using API filtering
      const tools = await this.listTools({ name: toolName });

      if (!tools || tools.length === 0) {
        throw new Error(`Tool with name '${toolName}' not found`);
      }

      const tool = tools[0];

      // Attach the tool by ID
      const result = await this.client.agents.tools.attach(tool.id, { agent_id: agentId });
      return result as unknown as LettaAgent;
    } catch (error) {
      // logger.debugerror('attachToolToAgentByName - error:', error);
      throw this.handleError(error);
    }
  }

  async listAgentsForBlock(blockId: string): Promise<LettaAgent[]> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized. Please set auth token first.');
      }

      const agentsPage = await this.client.blocks.agents.list(blockId);
      const agents = agentsPage.items || [];
      return agents as unknown as LettaAgent[];
    } catch (error) {
      // logger.debugerror('listAgentsForBlock - error:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    let message = 'An error occurred';
    let status = 0;
    let code: string | undefined;

    if (error?.message) {
      message = error.message;
    }

    // Check for SDK error properties
    if (error?.statusCode) {
      status = error.statusCode;
    } else if (error?.status) {
      status = error.status;
    }

    if (error?.code) {
      code = error.code;
    }

    // Try to extract detailed error information
    const responseData = error?.responseData || error?.data || error?.body;
    const response = error?.response || error?.rawResponse;

    const apiError = {
      message,
      status,
      code,
      response,
      responseData
    };

    // logger.debugerror('API error:', message, status ? `(${status})` : '');

    return apiError;
  }
}

// Create singleton instance
const lettaApi = new LettaApiService();

export { LettaApiService };
export default lettaApi;
