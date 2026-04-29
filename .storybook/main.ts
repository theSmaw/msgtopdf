import type { StorybookConfig } from '@storybook/react-vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(config) {
    config.plugins ??= []
    config.plugins.push(
      nodePolyfills({
        include: ['buffer'],
        globals: { Buffer: true, global: true, process: false },
      }),
    )
    return config
  },
}

export default config
