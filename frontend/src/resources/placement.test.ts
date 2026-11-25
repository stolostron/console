/* Copyright Contributors to the Open Cluster Management project */
import { PlacementApiVersion, PlacementDefinition, PlacementKind } from './placement'

describe('PlacementDefinition', () => {
  it('uses the v1beta1 API version for RBAC and resource definition', () => {
    expect(PlacementDefinition.apiVersion).toBe(PlacementApiVersion)
    expect(PlacementDefinition.kind).toBe(PlacementKind)
  })
})
