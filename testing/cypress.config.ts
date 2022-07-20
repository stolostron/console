/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from 'cypress'

export default defineConfig({
    viewportWidth: 1600,
    viewportHeight: 1120,
    pageLoadTimeout: 120000,
    defaultCommandTimeout: 30000,
    e2e: {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            require('@cypress/code-coverage/task')(on, config)
            return config
        },
        baseUrl: 'https://localhost:3000/',
    },
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        configFile: 'reporter-config.json',
    },
})
