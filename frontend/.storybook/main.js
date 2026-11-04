/* Copyright Contributors to the Open Cluster Management project */
const path = require('path')
const { pluginSass } = require('@rsbuild/plugin-sass')
const { pluginNodePolyfill } = require('@rsbuild/plugin-node-polyfill')
const { pluginReact } = require('@rsbuild/plugin-react')

module.exports = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@chromatic-com/storybook',
  ],

  stories: ['../src/ui-components/AcmPage/AcmPage.stories.tsx', '../src/**/*.stories.tsx'],

  rsbuildFinal: async (config) => {
    // Sass support and Node core-module polyfills (path, buffer, stream, process, …) that the
    // app code expects. Rsbuild/Rspack handle TS/TSX via the built-in SWC compiler, and
    // pluginNodePolyfill injects the Buffer/process globals by default.
    // pluginReact enables the automatic JSX runtime (matching tsconfig `jsx: react-jsx`), so
    // stories that use JSX without importing React compile correctly; storybook-react-rsbuild
    // does not add it on its own.
    config.plugins = config.plugins || []
    config.plugins.push(pluginReact(), pluginSass(), pluginNodePolyfill())

    // Tilde path for src and the dummy mock for @openshift-assisted/ui-lib.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': path.resolve(__dirname, '../src'),
      '@openshift-assisted/ui-lib/cim$': path.resolve(__dirname, '../__mocks__/@openshift-assisted/dummy.ts'),
    }

    return config
  },

  typescript: {
    check: false,
    checkOptions: {},
  },

  framework: {
    name: 'storybook-react-rsbuild',
    options: {},
  },

  staticDirs: [{ from: '../public', to: '/multicloud' }],

  docs: {
    autodocs: true,
  },
}
