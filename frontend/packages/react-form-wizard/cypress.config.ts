/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1440,
  viewportHeight: 1120,
  e2e: {
    baseUrl: 'http://localhost:3000',
    testIsolation: false,
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
})
