/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { getPolicySeverity, Policy, PolicySeverity } from '../../resources/policy'

export interface IGovernanceData {
  policies: IPolicy[]
  policyRisks: IPolicyRisks
  clusterRisks: IPolicyRisks
  clusterMap: { [clusterName: string]: IPolicyRisks }
  categories: IPolicyGrouping
  standards: IPolicyGrouping
  controls: IPolicyGrouping
}

export interface IPolicy extends Policy {
  clusterRisks: IPolicyRisks
}

export interface IPolicyGrouping {
  risks: IPolicyRisks
  groups: IPolicyGroup[]
}

export interface IPolicyGroup {
  name: string
  clusterRisks: IPolicyRisks
  policyRisks: IPolicyRisks
}

export interface IGovernanceDataMap {
  policies: IPolicy[]
  policyRisks: IPolicyRisks
  clustersMap: { [clusterName: string]: IPolicyRisks }
  categories: IGroupingMap
  standards: IGroupingMap
  controls: IGroupingMap
}

export interface IGroupingMap {
  [name: string]: {
    policyRisks: IPolicyRisks
    clustersMap: { [clusterName: string]: IPolicyRisks }
  }
}

function incrementPolicyRisks(policyRisks: IPolicyRisks, severity: PolicySeverity) {
  switch (severity) {
    case PolicySeverity.Low:
      policyRisks.low++
      break
    case PolicySeverity.Medium:
      policyRisks.medium++
      break
    case PolicySeverity.Critical:
      policyRisks.critical++
      break
    default:
      policyRisks.high++
      break
  }
}

function calculatePolicyRisks(groupMap: IGroupingMap): IPolicyRisks {
  const groups = Object.values(groupMap)
  const notCritical = groups.filter((group) => group.policyRisks.critical === 0)
  const notHigh = groups.filter((group) => group.policyRisks.high === 0)
  const notMed = notHigh.filter((group) => group.policyRisks.medium === 0)
  const notLow = notMed.filter((group) => group.policyRisks.low === 0)
  const notUnknown = notLow.filter((group) => group.policyRisks.unknown === 0)
  const notSynced = notUnknown.filter((group) => group.policyRisks.synced === 0)
  return {
    critical: groups.length - notCritical.length,
    high: groups.length - notHigh.length,
    medium: notHigh.length - notMed.length,
    low: notMed.length - notLow.length,
    unknown: notLow.length - notUnknown.length,
    synced: notUnknown.length - notSynced.length,
  }
}

function calculateClusterRisks(clusterRisksMap: { [clusterName: string]: IPolicyRisks }): IPolicyRisks {
  const clusters = Object.values(clusterRisksMap)
  const notCritical = clusters.filter((cluster) => cluster.critical === 0)
  const notHigh = clusters.filter((cluster) => cluster.high === 0)
  const notMed = notHigh.filter((cluster) => cluster.medium === 0)
  const notLow = notMed.filter((cluster) => cluster.low === 0)
  const notUnknown = notLow.filter((cluster) => cluster.unknown === 0)
  const notSynced = notUnknown.filter((cluster) => cluster.synced === 0)
  return {
    critical: clusters.length - notCritical.length,
    high: clusters.length - notHigh.length,
    medium: notHigh.length - notMed.length,
    low: notMed.length - notLow.length,
    unknown: notLow.length - notUnknown.length,
    synced: notUnknown.length - notSynced.length,
  }
}

export interface IPolicyRisks {
  synced: number
  critical: number
  high: number
  medium: number
  low: number
  unknown: number
}

function newPolicyRisks(): IPolicyRisks {
  return {
    synced: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  }
}

export function useGovernanceData(policies: Policy[]): IGovernanceData {
  const governanceData = useMemo(() => {
    const governanceDataMap: IGovernanceDataMap = {
      policies: [],
      policyRisks: newPolicyRisks(),
      clustersMap: {},
      categories: {},
      standards: {},
      controls: {},
    }

    for (const policy of policies) {
      const severity = getPolicySeverity(policy)
      const policyData = {
        ...policy,
        ...{ clusterRisks: newPolicyRisks() },
      }
      governanceDataMap.policies.push(policyData)

      switch (policy.status?.compliant) {
        case 'Compliant':
          governanceDataMap.policyRisks.synced++
          break
        case 'NonCompliant':
          incrementPolicyRisks(governanceDataMap.policyRisks, severity)
          break
        default:
          governanceDataMap.policyRisks.unknown++
          break
      }

      if (policyData.status?.status) {
        for (const cluster of policyData.status.status) {
          if (!governanceDataMap.clustersMap[cluster.clustername]) {
            governanceDataMap.clustersMap[cluster.clustername] = newPolicyRisks()
          }
          switch (cluster.compliant) {
            case 'Compliant':
              policyData.clusterRisks.synced++
              governanceDataMap.clustersMap[cluster.clustername].synced++
              break
            case 'NonCompliant':
              incrementPolicyRisks(policyData.clusterRisks, severity)
              incrementPolicyRisks(governanceDataMap.clustersMap[cluster.clustername], severity)
              break
            default:
              policyData.clusterRisks.unknown++
              governanceDataMap.clustersMap[cluster.clustername].unknown++
              break
          }
        }
      }

      for (const groupName of ['categories', 'standards', 'controls']) {
        const group = policyData.metadata.annotations?.[`policy.open-cluster-management.io/${groupName}`]
        if (group) {
          for (const name of group.split(',').map((categoryName) => categoryName.trim())) {
            const groupingMap = (governanceDataMap as any)[groupName] as unknown as IGroupingMap
            let groupRisks = groupingMap[name]
            if (!groupRisks) {
              groupRisks = {
                policyRisks: newPolicyRisks(),
                clustersMap: {},
              }
              groupingMap[name] = groupRisks
            }

            switch (policyData.status?.compliant) {
              case 'Compliant':
                groupRisks.policyRisks.synced++
                break
              case 'NonCompliant':
                incrementPolicyRisks(groupRisks.policyRisks, severity)
                break
            }

            if (policyData.status?.status) {
              for (const cluster of policyData.status.status) {
                if (groupRisks.clustersMap[cluster.clustername] === undefined) {
                  groupRisks.clustersMap[cluster.clustername] = newPolicyRisks()
                }

                switch (cluster.compliant) {
                  case 'Compliant':
                    groupRisks.clustersMap[cluster.clustername].synced++
                    break
                  case 'NonCompliant':
                    incrementPolicyRisks(groupRisks.clustersMap[cluster.clustername], severity)
                    break
                }
              }
            }
          }
        }
      }
    }

    const governanceData: IGovernanceData = {
      policies: governanceDataMap.policies,
      policyRisks: governanceDataMap.policyRisks,
      clusterMap: governanceDataMap.clustersMap,
      clusterRisks: calculateClusterRisks(governanceDataMap.clustersMap),
      categories: {} as any,
      standards: {} as any,
      controls: {} as any,
    }

    for (const groupName of ['categories', 'standards', 'controls']) {
      ;(governanceData as any)[groupName] = {
        risks: calculatePolicyRisks((governanceDataMap as any)[groupName]),
        groups: Object.keys((governanceDataMap as any)[groupName]).map((name) => {
          const value = (governanceDataMap as any)[groupName][name]
          return {
            name,
            policyRisks: value.policyRisks,
            clusterRisks: calculateClusterRisks(value.clustersMap),
          }
        }),
      }
    }
    return governanceData
  }, [policies])

  return governanceData
}
