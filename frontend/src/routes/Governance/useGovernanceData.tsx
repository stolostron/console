/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { PlacementBinding } from '../../resources/placement-binding'
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

function calculatePolicyRisks(groupMap: IGroupingMap): IPolicyRisks {
    const groups = Object.values(groupMap)
    const notHigh = groups.filter((group) => group.policyRisks.high === 0)
    const notMed = notHigh.filter((group) => group.policyRisks.medium === 0)
    const notLow = notMed.filter((group) => group.policyRisks.low === 0)
    const notUnknown = notLow.filter((group) => group.policyRisks.unknown === 0)
    const notSynced = notUnknown.filter((group) => group.policyRisks.synced === 0)
    return {
        high: groups.length - notHigh.length,
        medium: notHigh.length - notMed.length,
        low: notMed.length - notLow.length,
        unknown: notLow.length - notUnknown.length,
        synced: notUnknown.length - notSynced.length,
    }
}

function calculateClusterRisks(clusterRisksMap: { [clusterName: string]: IPolicyRisks }): IPolicyRisks {
    const clusters = Object.values(clusterRisksMap)
    const notHigh = clusters.filter((cluster) => cluster.high === 0)
    const notMed = notHigh.filter((cluster) => cluster.medium === 0)
    const notLow = notMed.filter((cluster) => cluster.low === 0)
    const notUnknown = notLow.filter((cluster) => cluster.unknown === 0)
    const notSynced = notUnknown.filter((cluster) => cluster.synced === 0)
    return {
        high: clusters.length - notHigh.length,
        medium: notHigh.length - notMed.length,
        low: notMed.length - notLow.length,
        unknown: notLow.length - notUnknown.length,
        synced: notUnknown.length - notSynced.length,
    }
}

export interface IPolicyRisks {
    synced: number
    high: number
    medium: number
    low: number
    unknown: number
}

export function useGovernanceData(
    policies: Policy[],
    placementBindings: PlacementBinding[]
    // placementRules: PlacementRule[]
): IGovernanceData {
    const governanceData = useMemo(() => {
        const governanceDataMap: IGovernanceDataMap = {
            policies: [],
            policyRisks: { synced: 0, high: 0, medium: 0, low: 0, unknown: 0 },
            clustersMap: {},
            categories: {},
            standards: {},
            controls: {},
        }

        for (const policy of policies) {
            const severity = getPolicySeverity(policy)
            const policyData = { ...policy, ...{ clusterRisks: { synced: 0, high: 0, medium: 0, low: 0, unknown: 0 } } }
            governanceDataMap.policies.push(policyData)

            switch (policy.status?.compliant) {
                case 'Compliant':
                    governanceDataMap.policyRisks.synced++
                    break
                case 'NonCompliant':
                    {
                        switch (severity) {
                            case PolicySeverity.Low:
                                governanceDataMap.policyRisks.low++
                                break
                            case PolicySeverity.Medium:
                                governanceDataMap.policyRisks.medium++
                                break
                            default:
                                governanceDataMap.policyRisks.high++
                                break
                        }
                    }
                    break
                // default:
                //     governanceDataMap.policyRisks.unknown++
                //     break
            }

            if (policyData.status?.status) {
                for (const cluster of policyData.status.status) {
                    if (!governanceDataMap.clustersMap[cluster.clustername]) {
                        governanceDataMap.clustersMap[cluster.clustername] = {
                            synced: 0,
                            high: 0,
                            medium: 0,
                            low: 0,
                            unknown: 0,
                        }
                    }
                    switch (cluster.compliant) {
                        case 'Compliant':
                            console.log(policyData.metadata.name, cluster.clustername, policyData.status.status)
                            policyData.clusterRisks.synced++
                            governanceDataMap.clustersMap[cluster.clustername].synced++
                            break
                        case 'NonCompliant':
                            {
                                switch (severity) {
                                    case PolicySeverity.Low:
                                        policyData.clusterRisks.low++
                                        governanceDataMap.clustersMap[cluster.clustername].low++
                                        break
                                    case PolicySeverity.Medium:
                                        policyData.clusterRisks.medium++
                                        governanceDataMap.clustersMap[cluster.clustername].medium++
                                        break
                                    default:
                                        policyData.clusterRisks.high++
                                        governanceDataMap.clustersMap[cluster.clustername].high++
                                        break
                                }
                            }
                            break
                        // default:
                        //     policyData.clusterRisks.unknown++
                        //     governanceDataMap.clustersMap[cluster.clustername].unknown++
                        //     break
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
                                policyRisks: { synced: 0, high: 0, medium: 0, low: 0, unknown: 0 },
                                clustersMap: {},
                            }
                            groupingMap[name] = groupRisks
                        }

                        switch (policyData.status?.compliant) {
                            case 'Compliant':
                                groupRisks.policyRisks.synced++
                                break
                            case 'NonCompliant':
                                {
                                    switch (severity) {
                                        case PolicySeverity.Low:
                                            groupRisks.policyRisks.low++
                                            break
                                        case PolicySeverity.Medium:
                                            groupRisks.policyRisks.medium++
                                            break
                                        default:
                                            groupRisks.policyRisks.high++
                                            break
                                    }
                                }
                                break
                        }

                        if (policyData.status?.status) {
                            for (const cluster of policyData.status.status) {
                                if (groupRisks.clustersMap[cluster.clustername] === undefined) {
                                    groupRisks.clustersMap[cluster.clustername] = {
                                        synced: 0,
                                        high: 0,
                                        medium: 0,
                                        low: 0,
                                        unknown: 0,
                                    }
                                }

                                switch (cluster.compliant) {
                                    case 'Compliant':
                                        groupRisks.clustersMap[cluster.clustername].synced++
                                        break
                                    case 'NonCompliant':
                                        switch (severity) {
                                            case PolicySeverity.Low:
                                                groupRisks.clustersMap[cluster.clustername].low++
                                                break
                                            case PolicySeverity.Medium:
                                                groupRisks.clustersMap[cluster.clustername].medium++

                                                break
                                            default:
                                                groupRisks.clustersMap[cluster.clustername].high++
                                                break
                                        }
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
                // {
                //     synced: Object.values(governanceDataMap[groupName]).filter(
                //         (v) => v.policyRisks.high === 0 && v.policyRisks.synced > 0
                //     ).length,
                //     high: Object.values(governanceDataMap[groupName]).filter((v) => v.policyRisks.high > 0).length,
                //     medium: Object.values(governanceDataMap[groupName]).filter((v) => v.policyRisks.medium > 0).length,
                //     low: Object.values(governanceDataMap[groupName]).filter((v) => v.policyRisks.low > 0).length,
                // },
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
        console.log(governanceData)
        return governanceData
    }, [policies, placementBindings])

    return governanceData
}
