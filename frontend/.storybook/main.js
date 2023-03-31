/* Copyright Contributors to the Open Cluster Management project */
const sass = require('sass')

module.exports = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
  ],
  stories: ['../src/ui-components/AcmPage/AcmPage.stories.tsx', '../src/ui-components/**/*.stories.tsx'],
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
    return config
  },
  typescript: {
    check: false,
    checkOptions: {},
  },
  framework: '@storybook/react',
  core: {
    builder: 'webpack5',
  },
  staticDirs: [{ from: '../public', to: '/multicloud' }],
}
