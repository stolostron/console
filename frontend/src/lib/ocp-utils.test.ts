/* Copyright Contributors to the Open Cluster Management project */

import { nockGet } from './nock-util'
import { launchToOCP } from './ocp-utils'
import { mockOpenShiftConsoleConfigMap } from './test-metadata'
import { waitForNocks } from './test-util'

describe('launchToOCP', () => {
    test('launchToOCP should return undefined if no defined api', async () => {
        const initialNocks = [nockGet(mockOpenShiftConsoleConfigMap)]
        await waitForNocks(initialNocks)
        expect(launchToOCP('oauth/token/request', true, undefined, true)).toBeFalsy()
    })
})
