import type { StorybookConfig } from '@storybook/angular';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../src/assets'], // Add this line
  webpackFinal: (config) => {
    if (config.resolve?.fallback)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        timers: false,
        child_process: false,
      };

    return config;
  },
};
export default config;
