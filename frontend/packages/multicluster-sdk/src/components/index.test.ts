/* Copyright Contributors to the Open Cluster Management project */
import * as components from './index'

describe('components index', () => {
  it('should export FleetResourceEventStream', () => {
    expect(components).toHaveProperty('FleetResourceEventStream')
    expect(typeof components.FleetResourceEventStream).toBe('function')
  })

  it('should export all expected components', () => {
    const expectedExports = ['FleetResourceEventStream']

    expectedExports.forEach((exportName) => {
      expect(components).toHaveProperty(exportName)
    })
  })

  it('should not export unexpected components', () => {
    const actualExports = Object.keys(components)
    const expectedExports = ['FleetResourceEventStream']

    expect(actualExports).toEqual(expectedExports)
  })
})
