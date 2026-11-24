/* Copyright Contributors to the Open Cluster Management project */
import { PlacementApiVersionBeta, PlacementDefinition, PlacementKind } from './placement'

describe('PlacementDefinition', () => {
  it('uses the v1beta1 API version for RBAC and resource definition', () => {
    expect(PlacementDefinition.apiVersion).toBe(PlacementApiVersionBeta)
    expect(PlacementDefinition.kind).toBe(PlacementKind)
  })
})
