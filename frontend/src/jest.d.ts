/* Copyright Contributors to the Open Cluster Management project */

// define some custom expects
declare global {
    namespace jest {
        interface Matchers<R> {
            hasMissingMocks(): R
            hasUnusedMocks(): R
            hasNoConsoleLogs(): R
        }
    }
}
