import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      viewportWidth: 1600
      viewportHeight: 1120
      baseUrl: 'https://localhost:3000/'
      pageLoadTimeout: 120000
      defaultCommandTimeout: 30000
    },
  },
})
