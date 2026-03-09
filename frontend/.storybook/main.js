/* Copyright Contributors to the Open Cluster Management project */
const path = require('path')

module.exports = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@chromatic-com/storybook',
  ],

  stories: ['../src/ui-components/AcmPage/AcmPage.stories.tsx', '../src/**/*.stories.tsx'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@openshift-assisted/ui-lib/cim': path.resolve(__dirname, '../__mocks__/@openshift-assisted/dummy.ts'),
    }
    return config
  },

  typescript: {
    check: false,
    checkOptions: {},
  },

  staticDirs: [{ from: '../public', to: '/multicloud' }],

  docs: {
    autodocs: true,
  },
}
