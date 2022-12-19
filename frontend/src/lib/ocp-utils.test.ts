/* Copyright Contributors to the Open Cluster Management project */

import { launchToOCP } from './ocp-utils'

describe('launchToOCP', () => {
    test('launchToOCP newtab true', () => {
        // These are the default values
        expect(launchToOCP('/blah', true)).toEqual(undefined)
    })
})

describe('launchToOCP', () => {
    test('launchToOCP newtab false', () => {
        // These are the default values
        expect(launchToOCP('/blah', false)).toEqual(undefined)
    })
})
