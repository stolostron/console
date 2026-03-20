/* Copyright Contributors to the Open Cluster Management project */
const sass = require('sass')
const path = require('path')
const webpack = require('webpack')

module.exports = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-webpack5-compiler-babel',
    '@chromatic-com/storybook'
  ],

  stories: ['../src/ui-components/AcmPage/AcmPage.stories.tsx', '../src/**/*.stories.tsx'],

  webpackFinal: async (config) => {
    config.module.rules.push(
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
            },
          },
        ],
      }
    )
    
    config.resolve.extensions.push('.ts', '.tsx')

    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer'),
    }

    config.plugins.push(
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' })
    )
    
    // Add alias for mocking @openshift-assisted/ui-lib and tilde path for src
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
    name: '@storybook/react-webpack5',
    options: {}
  },

  staticDirs: [{ from: '../public', to: '/multicloud' }],

  docs: {
    autodocs: true
  }
}
