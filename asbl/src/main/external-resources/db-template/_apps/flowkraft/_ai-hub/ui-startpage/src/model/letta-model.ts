export interface LettaAgent {
  id: string;
  name: string;
  system?: string;
  agent_type?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
  last_run_completion?: string;
  last_run_duration_ms?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  tools?: LettaTool[];
  sources?: LettaSource[];
  memory?: {
    blocks: MemoryBlock[];
    file_blocks?: FileBlock[];
    prompt_template?: string;
  };
  llm_config?: LlmConfig;
  embedding_config?: EmbeddingConfig;
  hidden?: boolean;
  timezone?: string;
  enable_sleeptime?: boolean;
  sleeptime_agent_id?: string;
  multi_agent_group?: {
    id: string;
    manager_type: string;
    agent_ids: string[];
    manager_agent_id?: string;
  };
}

export interface MemoryBlock {
  id?: string;
  label: string;
  value: string;
  limit?: number;
  project_id?: string;
  name?: string;
  is_template?: boolean;
  base_template_id?: string;
  deployment_id?: string;
  entity_id?: string;
  preserve_on_migration?: boolean;
  read_only?: boolean;
  description?: string;
  metadata?: Record<string, any>;
  hidden?: boolean;
  created_by_id?: string;
  last_updated_by_id?: string;
}

export interface FileBlock extends MemoryBlock {
  file_id?: string;
  source_id?: string;
  is_open?: boolean;
  last_accessed_at?: string;
}

export interface LlmConfig {
  model: string;
  model_endpoint_type?: string;
  context_window?: number;
  model_endpoint?: string;
  provider_name?: string;
  provider_category?: string;
  model_wrapper?: string;
  put_inner_thoughts_in_kwargs?: boolean;
  handle?: string;
  temperature?: number;
  max_tokens?: number;
  enable_reasoner?: boolean;
  reasoning_effort?: string;
  max_reasoning_tokens?: number;
  frequency_penalty?: number;
  compatibility_type?: string;
  verbosity?: string;
  tier?: string;
}

export interface EmbeddingConfig {
  embedding_endpoint_type?: string;
  embedding_model?: string;
  embedding_dim?: number;
  embedding_endpoint?: string;
  embedding_chunk_size?: number;
  handle?: string;
  batch_size?: number;
  azure_endpoint?: string;
  azure_version?: string;
  azure_deployment?: string;
}

export interface LettaSource {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  vector_db_provider?: string;
  created_by_id?: string;
  last_updated_by_id?: string;
  created_at?: string;
  updated_at?: string;
  embedding_config?: EmbeddingConfig;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
}

export interface ListProjectsParams {
  name?: string;
  limit?: number;
  offset?: number;
}

export interface ListProjectsResponse {
  projects: Project[];
  hasNextPage: boolean;
}

export interface LettaMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
  tool_calls?: ToolCall[];
  tool_call?: ToolCall;
  tool_response?: any;
  message_type?: string;
  sender_id?: string;
  step_id?: string;
  run_id?: string;
  reasoning?: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
  result?: any;
}

export interface SendMessageRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | ContentPart[];
  }>;
  max_steps?: number;
  use_assistant_message?: boolean;
  enable_thinking?: boolean;
  stream_tokens?: boolean;
  include_pings?: boolean;
}

export interface SendMessageResponse {
  messages: LettaMessage[];
  stop_reason?: {
    type: string;
    message?: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CreateAgentRequest {
  name: string;
  model?: string;
  embedding?: string;
  memoryBlocks?: MemoryBlock[];
  tools?: string[];
  sources?: string[];
  description?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  sleeptimeEnable?: boolean;
  system?: string;
  includeBaseTools?: boolean;
  includeMultiAgentTools?: boolean;
  includeDefaultSource?: boolean;
  contextWindowLimit?: number;
  embeddingChunkSize?: number;
  maxTokens?: number;
  enableReasoner?: boolean;
}

export interface ListAgentsParams {
  name?: string;
  tags?: string[];
  matchAllTags?: boolean;
  before?: string;
  after?: string;
  limit?: number;
  queryText?: string;
  projectId?: string;
  templateId?: string;
  identityId?: string;
  sortBy?: string;
}

export interface ListMessagesParams {
  after?: string;
  before?: string;
  limit?: number;
  group_id?: string;
  use_assistant_message?: boolean;
  assistant_message_tool_name?: string;
  assistant_message_tool_kwargs?: string;
  include_err?: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  response?: any;
  responseData?: any;
}

export interface LettaTool {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  source_code?: string;
  json_schema?: Record<string, any>;
  source_type?: string;
  module?: string;
  tool_type?: string;
}

export interface LettaModel {
  model: string;
  model_endpoint_type: string;
  context_window: number;
  provider_name: string;
  temperature?: number;
  max_tokens?: number;
  reasoning?: boolean;
}

export interface LettaEmbeddingModel {
  embedding_model: string;
  embedding_endpoint_type: string;
  provider_name: string;
  chunk_size?: number;
  dimensions?: number;
}

export interface StreamingChunk {
  message_type: 'ping' | 'assistant_message' | 'reasoning_message' | 'tool_call' | 'tool_call_message' | 'tool_response' | 'tool_return_message' | 'approval_request_message' | 'step_complete' | 'stop_reason' | 'usage_statistics';
  content?: string | ContentPart[];
  tool_call?: ToolCall;
  tool_calls?: ToolCall[];
  toolCall?: ToolCall;
  tool_response?: unknown;
  reasoning?: string;
  step?: number;
  run_id?: string;
  seq_id?: number;
  id?: string;
  error?: unknown;
}

export interface ContentPart {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: string;
    data?: string;
    mediaType?: string;
    media_type?: string;
    url?: string;
  };
}

export interface Passage {
  id: string;
  text: string;
  embedding?: number[];
  embedding_config?: EmbeddingConfig;
  created_by_id?: string;
  last_updated_by_id?: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  archive_id?: string;
  source_id?: string;
  file_id?: string;
  file_name?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ListPassagesParams {
  after?: string;
  before?: string;
  limit?: number;
  search?: string;
  ascending?: boolean;
}

export interface CreatePassageRequest {
  text: string;
  tags?: string[];
  created_at?: string;
}

export interface SearchPassagesParams {
  query: string;
  tags?: string[];
  tag_match_mode?: 'any' | 'all';
  top_k?: number;
  start_datetime?: string;
  end_datetime?: string;
}

export interface SearchPassagesResult {
  timestamp: string;
  content: string;
  tags?: string[];
}

export interface SearchPassagesResponse {
  results: SearchPassagesResult[];
  count: number;
}
