/* Copyright Contributors to the Open Cluster Management project */

import { launchToOCP } from './ocp-utils'

describe('launchToOCP', () => {
    test('launchToOCP newtab true', () => {
        // These are the default values
        expect(launchToOCP('/blah')).toEqual(undefined)
    })
})
