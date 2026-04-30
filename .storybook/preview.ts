import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light-grey',
      values: [
        { name: 'light-grey', value: '#f1f5f9' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
