/* Copyright Contributors to the Open Cluster Management project */
import i18next from 'i18next'

/**
 * A real TFunction bound to the test i18next instance (initialized in setupTests.ts).
 * Use this instead of casting mock functions to TFunction in tests.
 */
export const t = i18next.t.bind(i18next)
