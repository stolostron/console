/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'node:fs'
import { defineConfig } from 'i18next-cli'
import { pluginExtensionsPlugin } from './i18n-scripts/plugins/plugin-extensions'

const GENERATE = process.env.MODE === 'generate'

let enTranslations: Record<string, string> | undefined

export default defineConfig({
  locales: GENERATE ? ['ja', 'ko', 'zh', 'fr', 'es'] : ['en'],

  extract: {
    input: ['./src/**/*.tsx', './src/**/*.ts', './src/**/*.js', './plugins/**/console-extensions.ts'],
    output: GENERATE
      ? 'public/locales/upload/{{language}}-{{namespace}}.json'
      : 'public/locales/{{language}}/{{namespace}}.json',

    defaultNS: 'translation',
    keySeparator: false,
    nsSeparator: '~',
    contextSeparator: '_',
    pluralSeparator: '_',

    functions: ['t', '*.t', 'i18n'],
    useTranslationNames: ['useTranslation'],

    sort: true,
    indentation: 2,
    removeUnusedKeys: true,

    primaryLanguage: 'en',
    defaultValue: (key: string, _namespace: string, language: string) => {
      if (language === 'en') {
        return key
      }
      if (!enTranslations) {
        enTranslations = JSON.parse(readFileSync('public/locales/en/translation.json', 'utf-8'))
      }
      return enTranslations?.[key] ?? ''
    },
  },

  plugins: [pluginExtensionsPlugin()],
})
