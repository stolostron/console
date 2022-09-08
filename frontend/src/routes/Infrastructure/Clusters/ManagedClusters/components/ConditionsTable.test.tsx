/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { waitForText } from '../../../../../lib/test-util'
import ConditionsTable from './ConditionsTable'

const conditions: any = [
    {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'Configuration passes validation',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'False',
        type: 'ValidConfiguration',
    },
    {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'True',
        type: 'Progressing',
    },
]

describe('ConditionsTable', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<ConditionsTable conditions={conditions} />)
    })

    it('should render conditions table', async () => {
        await waitForText(conditions[0].message)
    })
})
