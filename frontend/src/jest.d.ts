/* Copyright Contributors to the Open Cluster Management project */

// define some custom expects
declare namespace jest {
    interface Matchers<R> {
        hasMissingMocks(): R
        hasUnusedMocks(): R
        hasNoMissingNocks(): R
        hasNoPendingNocks(): R
    }
}
