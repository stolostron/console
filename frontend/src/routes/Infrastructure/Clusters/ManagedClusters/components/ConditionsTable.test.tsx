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
  {
    lastTransitionTime: '2022-08-31T18:55:06Z',
    message: 'HostedCluster is degraded',
    observedGeneration: 1564,
    reason: 'AsExpected',
    status: 'True',
    type: 'Degraded',
  },
]

const handleModalToggle = () => {}

const conditionsWithDegradeFalse: any = [
  {
    lastTransitionTime: '2022-08-31T18:55:06Z',
    message: 'Configuration passes validation',
    observedGeneration: 1564,
    reason: 'HostedClusterAsExpected',
    status: 'True',
    type: 'ValidConfiguration',
  },
  {
    lastTransitionTime: '2022-08-31T18:55:06Z',
    message: 'HostedCluster is not degraded',
    observedGeneration: 1564,
    reason: 'AsExpected',
    status: 'False',
    type: 'Degraded',
  },
]

describe('ConditionsTable', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(<ConditionsTable handleModalToggle={handleModalToggle} conditions={conditions} />)
  })

  it('should render conditions table', async () => {
    await waitForText(conditions[0].message)
  })
})

describe('ConditionsTable no conditions', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(<ConditionsTable handleModalToggle={handleModalToggle} conditions={[]} />)
  })

  it('should render conditions table with no conditions', async () => {
    await waitForText('Condition')
  })
})

describe('ConditionsTable conditions undefined', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(<ConditionsTable handleModalToggle={handleModalToggle} conditions={undefined} />)
  })

  it('should render conditions table with conditions undefined', async () => {
    await waitForText('Condition')
  })
})

describe('ConditionsTable conditions degraded false', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(<ConditionsTable handleModalToggle={handleModalToggle} conditions={conditionsWithDegradeFalse} />)
  })

  it('should render conditions table with degraded false', async () => {
    await waitForText(conditionsWithDegradeFalse[0].message)
  })
})
