/* Copyright Contributors to the Open Cluster Management project */
import * as components from './index'

describe('components index', () => {
  it('should export FleetResourceEventStream', () => {
    expect(components.FleetResourceEventStream).toBeDefined()
    expect(typeof components.FleetResourceEventStream).toBe('function')
  })
})
