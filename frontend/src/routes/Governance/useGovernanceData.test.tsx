/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { Policy } from '../../resources/policy'
import { generateSeverity } from '../../test-helpers/generateSeverity'
import { useGovernanceData, IPolicyRisks, IPolicyGroup, IGovernanceData } from './useGovernanceData'

function generatePolicy(annotation: string, groupNames: string, severity: string, clusters: string[]): Policy {
  const policy = {
    metadata: {
      annotations: {},
    },
    spec: {
      disabled: false,
      remediationAction: 'inform',
    },
    status: {
      compliant: undefined,
      status: undefined,
    },
  } as Policy

  if (policy.metadata.annotations)
    policy.metadata.annotations[`policy.open-cluster-management.io/${annotation}`] = groupNames
  policy.spec['policy-templates'] = [generateSeverity(severity)]
  policy.status = {
    compliant: 'NonCompliant',
    status: undefined,
  }
  policy.status.status = clusters.map((cluster) => {
    return {
      clustername: cluster,
      clusternamespace: cluster,
      compliant: 'NonCompliant',
    }
  })

  return policy
}

describe('useGovernanceData', () => {
  const policies = [
    generatePolicy('categories', 'cat1,cat2,cat3', 'low', ['cluster1', 'cluster2', 'cluster3']),
    generatePolicy('categories', 'cat2,cat3,cat4', 'medium', ['cluster1', 'cluster2', 'cluster3']),
    generatePolicy('standards', 'std1,std2,std3', 'high', ['cluster1', 'cluster2', 'cluster3']),
    generatePolicy('standards', 'std2,std3,std4', 'low', ['cluster1', 'cluster2', 'cluster3']),
    generatePolicy('controls', 'ctrl1,ctrl2,ctrl3', 'critical', ['cluster1', 'cluster2', 'cluster3']),
    generatePolicy('controls', 'ctrl2,ctrl3,ctrl4', 'meltdown', ['cluster1', 'cluster2', 'cluster3']),
  ]

  const { result } = renderHook(() => useGovernanceData(policies))
  let risks: IGovernanceData
  it('should return results', () => {
    waitFor(() => expect(result.current).not.toBeUndefined())
    risks = result.current
  })
  it('should generate risks for clusters', () => {
    ;['cluster1', 'cluster2', 'cluster3'].forEach((cluster) =>
      expect(risks.clusterMap[cluster]).toEqual({
        critical: 1,
        high: 2,
        medium: 1,
        low: 2,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks)
    )
  })
  it('should generate risks for categories groups', () => {
    expect(risks.categories.risks).toEqual({
      critical: 0,
      high: 0,
      medium: 3,
      low: 1,
      synced: 0,
      unknown: 0,
    } as IPolicyRisks)
    expect(risks.categories.groups[0]).toEqual({
      name: 'cat1',
      policyRisks: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 3,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.categories.groups[1]).toEqual({
      name: 'cat2',
      policyRisks: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 0,
        medium: 3,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.categories.groups[2]).toEqual({
      name: 'cat3',
      policyRisks: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 0,
        medium: 3,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.categories.groups[3]).toEqual({
      name: 'cat4',
      policyRisks: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 0,
        medium: 3,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
  })
  it('should generate risks for standards groups', () => {
    expect(risks.standards.risks).toEqual({
      critical: 0,
      high: 3,
      medium: 0,
      low: 1,
      synced: 0,
      unknown: 0,
    } as IPolicyRisks)
    expect(risks.standards.groups[0]).toEqual({
      name: 'std1',
      policyRisks: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.standards.groups[1]).toEqual({
      name: 'std2',
      policyRisks: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.standards.groups[2]).toEqual({
      name: 'std3',
      policyRisks: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.standards.groups[3]).toEqual({
      name: 'std4',
      policyRisks: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 1,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 3,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
  })
  it('should generate risks for controls groups', () => {
    expect(risks.controls.risks).toEqual({
      critical: 3,
      high: 3,
      medium: 0,
      low: 0,
      synced: 0,
      unknown: 0,
    } as IPolicyRisks)
    expect(risks.controls.groups[0]).toEqual({
      name: 'ctrl1',
      policyRisks: {
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 3,
        high: 0,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.controls.groups[1]).toEqual({
      name: 'ctrl2',
      policyRisks: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 3,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.controls.groups[2]).toEqual({
      name: 'ctrl3',
      policyRisks: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 3,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
    expect(risks.controls.groups[3]).toEqual({
      name: 'ctrl4',
      policyRisks: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
      clusterRisks: {
        critical: 0,
        high: 3,
        medium: 0,
        low: 0,
        synced: 0,
        unknown: 0,
      } as IPolicyRisks,
    } as IPolicyGroup)
  })
})
