/**
 * Application configuration
 * Centralized configuration for the entire app
 */

export const lettaConfig = {
  api: {
    baseURL: process.env.EXPO_PUBLIC_API_URL || process.env.LETTA_BASE_URL || 'http://localhost:8283',
    timeout: 120000, // 2 minutes - agent creation with sleeptime can take a while
    retries: 3,
    retryDelay: 1000,
  },

  features: {
    enableSleeptime: false, // Disabled for simple advisor agents
    maxImageSize: 5 * 1024 * 1024, // 5MB
    messagePageSize: 50,
    initialMessageLoad: 100,
    developerMode: true,
  },

  ui: {
    animationDuration: 400,
    debounceDelay: 300,
    scrollToBottomDelay: 100,
  },

  app: {
    name: 'FlowKraft AI Crew',
    version: '1.0.0',
    description: 'FlowKraft\'s AI Crew - advisor agents dashboard',
  },
} as const;

export const Constants = {
  LETTA_BASE_URL: lettaConfig.api.baseURL,
  LETTA_API_KEY: process.env.LETTA_API_KEY,
  DEFAULT_MODEL: 'letta',
  DEFAULT_EMBEDDING: 'text-embedding-ada-002',
  MAX_BLOCK_SIZE: 20 * 1024, // Maximum size for memory blocks in characters (20KB)
  BLOCK_LABEL_MAX: 50, // Maximum length for block labels
  SHORT_AGENT_ID_LEN: 8, // Length for shortened agent IDs
};

export const Platform = {
  OS: 'web', // For Next.js web apps (not React Native)
  isDocker: process.env.RUNNING_IN_DOCKER === 'true',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
