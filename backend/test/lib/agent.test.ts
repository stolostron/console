/* Copyright Contributors to the Open Cluster Management project */

import { Agent } from 'node:https'

jest.mock('../../src/lib/serviceAccountToken', () => ({
  getServiceCACertificate: jest.fn().mockReturnValue('service-ca-cert'),
  getCACertificate: jest.fn().mockReturnValue('cluster-ca-cert'),
  getPlacementDebugCACertificate: jest.fn().mockReturnValue(undefined),
}))

import { getPlacementDebugCACertificate, getServiceCACertificate } from '../../src/lib/serviceAccountToken'

const mockGetPlacementDebugCA = getPlacementDebugCACertificate as jest.MockedFunction<
  typeof getPlacementDebugCACertificate
>
const mockGetServiceCA = getServiceCACertificate as jest.MockedFunction<typeof getServiceCACertificate>

describe('getPlacementDebugAgent', () => {
  let getPlacementDebugAgent: typeof import('../../src/lib/agent').getPlacementDebugAgent
  let getServiceAgent: typeof import('../../src/lib/agent').getServiceAgent

  beforeEach(async () => {
    jest.resetModules()

    // Re-apply mocks after module reset
    jest.mock('../../src/lib/serviceAccountToken', () => ({
      getServiceCACertificate: mockGetServiceCA,
      getCACertificate: jest.fn().mockReturnValue('cluster-ca-cert'),
      getPlacementDebugCACertificate: mockGetPlacementDebugCA,
    }))

    mockGetServiceCA.mockReturnValue('service-ca-cert')
    mockGetPlacementDebugCA.mockReturnValue(undefined)

    const agentModule = await import('../../src/lib/agent')
    getPlacementDebugAgent = agentModule.getPlacementDebugAgent
    getServiceAgent = agentModule.getServiceAgent
  })

  it('falls back to service agent when PLACEMENT_CA_BUNDLE_PATH is not configured', () => {
    mockGetPlacementDebugCA.mockReturnValue(undefined)

    const agent = getPlacementDebugAgent()
    const serviceAgent = getServiceAgent()

    expect(agent).toBe(serviceAgent)
  })

  it('returns a dedicated agent when OCM CA is available', () => {
    mockGetPlacementDebugCA.mockReturnValue('ocm-ca-bundle-cert')

    const agent = getPlacementDebugAgent()
    const serviceAgent = getServiceAgent()

    expect(agent).toBeInstanceOf(Agent)
    expect(agent).not.toBe(serviceAgent)
  })

  it('caches the placement debug agent across calls', () => {
    mockGetPlacementDebugCA.mockReturnValue('ocm-ca-bundle-cert')

    const first = getPlacementDebugAgent()
    const second = getPlacementDebugAgent()

    expect(first).toBe(second)
  })

  it('invalidates cached agent when OCM CA changes', () => {
    let onChangeCallback: (() => void) | undefined
    mockGetPlacementDebugCA.mockImplementation((onChange?: () => void) => {
      onChangeCallback = onChange
      return 'ocm-ca-bundle-cert'
    })

    const first = getPlacementDebugAgent()
    expect(first).toBeInstanceOf(Agent)
    expect(onChangeCallback).toBeDefined()

    // Simulate cert rotation
    if (onChangeCallback) onChangeCallback()

    const second = getPlacementDebugAgent()
    expect(second).toBeInstanceOf(Agent)
    expect(second).not.toBe(first)
  })

  it('transitions from service agent to dedicated agent when CA becomes available', () => {
    mockGetPlacementDebugCA.mockReturnValue(undefined)
    const withoutCA = getPlacementDebugAgent()
    expect(withoutCA).toBe(getServiceAgent())

    mockGetPlacementDebugCA.mockReturnValue('ocm-ca-bundle-cert')
    const withCA = getPlacementDebugAgent()
    expect(withCA).not.toBe(withoutCA)
    expect(withCA).toBeInstanceOf(Agent)
  })
})
