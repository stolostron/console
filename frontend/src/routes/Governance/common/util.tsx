/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/rules-of-hooks */
import { Chip } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import {
    Channel,
    Cluster,
    HelmRelease,
    Placement,
    PlacementBinding,
    PlacementRule,
    Policy,
    PolicySet,
    Subscription,
} from '../../../resources'
import { PlacementDecision } from '../../../resources/placement-decision'
import ResourceLabels from '../../Applications/components/ResourceLabels'

export interface PolicyCompliance {
    policyName: string
    policyNamespace: string
    clusterCompliance: { clusterName: string; compliance: 'Compliant' | 'NonCompliant' }[]
}

export interface ClusterPolicies {
    policyName: string
    policyNamespace: string
    compliance: string
}

export function getPlacementBindingsForResource(resource: Policy | PolicySet, placementBindings: PlacementBinding[]) {
    return placementBindings.filter(
        (placementBinding) =>
            placementBinding.metadata.namespace === resource.metadata.namespace &&
            placementBinding.subjects?.find(
                (subject) => subject.kind === resource.kind && subject.name === resource.metadata.name
            )
    )
}

export function getPlacementsForResource<T extends Placement | PlacementRule>(
    resource: Policy | PolicySet,
    placementBindings: PlacementBinding[],
    placements: T[]
) {
    const resourcePlacementBindings = getPlacementBindingsForResource(resource, placementBindings)
    return placements
        .filter((placement) => placement.metadata.namespace === resource.metadata.namespace)
        .filter((placement) =>
            resourcePlacementBindings.find(
                (placementBinding: PlacementBinding) =>
                    placementBinding.placementRef.kind === placement.kind &&
                    placementBinding.placementRef.name === placement.metadata.name
            )
        )
}

export function getPlacementDecisionsForPlacements(
    placementDecisions: PlacementDecision[],
    placements: (Placement | PlacementRule)[]
) {
    return placementDecisions.filter((placementDecision) =>
        placementDecision.metadata.ownerReferences?.find((ownerReference) =>
            placements.find((placement) => placement.metadata.uid === ownerReference.uid)
        )
    )
}

export function getPlacementDecisionsForResource(
    resource: Policy | PolicySet,
    placementDecisions: PlacementDecision[],
    resourceBindings: PlacementBinding[],
    placements: (Placement | PlacementRule)[]
) {
    const resourcePlacements = getPlacementsForResource(resource, resourceBindings, placements)
    return getPlacementDecisionsForPlacements(placementDecisions, resourcePlacements)
}

export function getPoliciesForPolicySet(policySet: PolicySet, policies: Policy[]) {
    return policies.filter(
        (policy) =>
            policy.metadata.namespace === policySet.metadata.namespace &&
            policySet.spec.policies.includes(policy.metadata.name ?? '')
    )
}

export function getPolicyForCluster(cluster: Cluster, policies: Policy[]) {
    const clusterPolicies: ClusterPolicies[] = []
    for (const policy of policies) {
        const policyStatus = policy.status?.status
        if (policyStatus) {
            for (const status of policyStatus) {
                if (status.clustername === cluster.name) {
                    clusterPolicies.push({
                        policyName: policy.metadata.name!,
                        policyNamespace: policy.metadata.namespace!,
                        compliance: status.compliant,
                    })
                }
            }
        }
    }
    return clusterPolicies
}

export function getPolicyComplianceForPolicySet(
    policySet: PolicySet,
    policies: Policy[],
    placementDecisions: PlacementDecision[],
    resourceBindings: PlacementBinding[],
    placements: (Placement | PlacementRule)[]
) {
    const policySetPlacementDecisions = getPlacementDecisionsForResource(
        policySet,
        placementDecisions,
        resourceBindings,
        placements
    )
    const policySetPolicies = getPoliciesForPolicySet(policySet, policies)

    const policyCompliance: PolicyCompliance[] = []
    for (const placementDecision of policySetPlacementDecisions) {
        for (const decision of placementDecision.status.decisions) {
            for (const policy of policySetPolicies) {
                const policyIdx = policyCompliance.findIndex((p) => p.policyName === policy.metadata.name!)
                const policyClusterStatus = policy.status?.status?.find(
                    (clusterStatus) => clusterStatus.clustername === decision.clusterName
                )
                if (policyClusterStatus?.compliant === 'NonCompliant') {
                    if (policyIdx < 0) {
                        policyCompliance.push({
                            policyName: policy.metadata.name!,
                            policyNamespace: policy.metadata.namespace!,
                            clusterCompliance: [
                                {
                                    clusterName: decision.clusterName,
                                    compliance: 'NonCompliant',
                                },
                            ],
                        })
                    } else {
                        policyCompliance[policyIdx].clusterCompliance.push({
                            clusterName: decision.clusterName,
                            compliance: 'NonCompliant',
                        })
                    }
                } else if (policyClusterStatus?.compliant === 'Compliant') {
                    if (policyIdx < 0) {
                        policyCompliance.push({
                            policyName: policy.metadata.name!,
                            policyNamespace: policy.metadata.namespace!,
                            clusterCompliance: [
                                {
                                    clusterName: decision.clusterName,
                                    compliance: 'Compliant',
                                },
                            ],
                        })
                    } else {
                        policyCompliance[policyIdx].clusterCompliance.push({
                            clusterName: decision.clusterName,
                            compliance: 'Compliant',
                        })
                    }
                }
            }
        }
    }
    return policyCompliance
}

export function getClustersComplianceForPolicySet(
    policySet: PolicySet,
    policies: Policy[],
    placementDecisions: PlacementDecision[],
    resourceBindings: PlacementBinding[],
    placements: (Placement | PlacementRule)[]
) {
    const policySetPlacementDecisions = getPlacementDecisionsForResource(
        policySet,
        placementDecisions,
        resourceBindings,
        placements
    )
    const policySetPolicies = getPoliciesForPolicySet(policySet, policies)

    const clustersCompliance: Record<string, 'Compliant' | 'NonCompliant'> = {}
    for (const placementDecision of policySetPlacementDecisions) {
        for (const decision of placementDecision.status.decisions) {
            if (clustersCompliance[decision.clusterName] === 'NonCompliant') {
                continue
            }
            for (const policy of policySetPolicies) {
                const policyClusterStatus = policy.status?.status?.find(
                    (clusterStatus) => clusterStatus.clustername === decision.clusterName
                )
                if (policyClusterStatus?.compliant === 'NonCompliant') {
                    clustersCompliance[decision.clusterName] = 'NonCompliant'
                } else if (policyClusterStatus?.compliant === 'Compliant') {
                    clustersCompliance[decision.clusterName] = 'Compliant'
                }
            }
        }
    }
    return clustersCompliance
}

export function getClustersSummaryForPolicySet(
    policySet: PolicySet,
    policies: Policy[],
    placementDecisions: PlacementDecision[],
    resourceBindings: PlacementBinding[],
    placements: (Placement | PlacementRule)[]
) {
    const clustersCompliance = getClustersComplianceForPolicySet(
        policySet,
        policies,
        placementDecisions,
        resourceBindings,
        placements
    )
    const compliant: string[] = []
    const nonCompliant: string[] = []
    for (const clusterName in clustersCompliance) {
        switch (clustersCompliance[clusterName]) {
            case 'Compliant':
                compliant.push(clusterName)
                break
            case 'NonCompliant':
                nonCompliant.push(clusterName)
                break
        }
    }

    return { compliant, nonCompliant }
}

export function resolveExternalStatus(policy: Policy) {
    const knownExternalManagers = ['multicluster-operators-subscription', 'argocd-application-controller']
    const managedFields = policy.metadata.managedFields ?? []
    return managedFields.some((mf) => knownExternalManagers.includes(mf.manager ?? 'none'))
}

function getHelmReleaseMap(helmReleases: HelmRelease[]) {
    const resourceMap = new Map()
    helmReleases.forEach((helmRelease: HelmRelease) => {
        resourceMap.set(`${helmRelease.metadata.namespace}/${helmRelease.metadata.name}`, helmRelease)
    })
    return resourceMap
}
function getSubscriptionMap(subscriptions: Subscription[]) {
    const resourceMap = new Map()
    subscriptions.forEach((subscription: Subscription) => {
        resourceMap.set(`${subscription.metadata.namespace}/${subscription.metadata.name}`, subscription)
    })
    return resourceMap
}
function getChannelMap(channels: Channel[]) {
    const resourceMap = new Map()
    channels.forEach((channel: Channel) => {
        resourceMap.set(`${channel.metadata.namespace}/${channel.metadata.name}`, channel)
    })
    return resourceMap
}

// This function may need some revision/testing
export function resolveSource(
    policy: Policy,
    helmReleases: HelmRelease[],
    channels: Channel[],
    subscriptions: Subscription[]
) {
    const getAnnotations = (item: any) => item?.metadata?.annotations ?? {}
    const getHostingSubscription = (annotations: any) =>
        annotations['apps.open-cluster-management.io/hosting-subscription']
    const parentAnnotations = getAnnotations(policy)
    let hostingSubscription = getHostingSubscription(parentAnnotations)
    if (!hostingSubscription) {
        // check if this policy was deployed by a Helm release
        const releaseNamespace = parentAnnotations['meta.helm.sh/release-namespace']
        const releaseName = parentAnnotations['meta.helm.sh/release-name']
        if (releaseNamespace && releaseName) {
            const helmReleaseMap = getHelmReleaseMap(helmReleases)
            const helmRelease = helmReleaseMap.get(`${releaseNamespace}/${releaseName}`)
            const helmReleaseAnnotations = getAnnotations(helmRelease)
            hostingSubscription = getHostingSubscription(helmReleaseAnnotations)
        }
    }
    if (hostingSubscription) {
        const subscriptionMap = getSubscriptionMap(subscriptions)
        const channelMap = getChannelMap(channels)
        const subscription = subscriptionMap.get(hostingSubscription)
        const channel = channelMap.get(subscription.spec.channel ?? '')
        if (subscription && channel) {
            const subscriptionAnnotations = getAnnotations(subscription)
            const getGitAnnotation = (annotations: any, name: string) =>
                annotations[`apps.open-cluster-management.io/git-${name}`] ||
                annotations[`apps.open-cluster-management.io/github-${name}`]
            return {
                bucketPath: subscriptionAnnotations['apps.open-cluster-management.io/bucket-path'],
                gitPath: getGitAnnotation(subscriptionAnnotations, 'path'),
                gitBranch: getGitAnnotation(subscriptionAnnotations, 'branch'),
                gitCommit: getGitAnnotation(subscriptionAnnotations, 'commit'),
                type: channel.spec.type ?? '',
                pathName: channel.spec.pathname ?? '',
                package: subscription.spec.name ?? '',
                packageFilterVersion: subscription.spec.packageFilter?.version ?? '',
            }
        }
    }
    return null
}

export function getSourceText(policySource: any, isExternal: boolean, t: TFunction) {
    if (policySource.type) {
        const channelType = (policySource.type && policySource.type.toLowerCase()) || ''
        const normalizedChannelType: string = channelType === 'github' ? 'git' : channelType
        return normalizedChannelType.charAt(0).toUpperCase() + normalizedChannelType.slice(1)
    } else if (isExternal) {
        return t('External')
    } else {
        return t('Local')
    }
}

export function getSource(policySource: any, isExternal: boolean, t: TFunction) {
    if (policySource) {
        return (
            // Reusing the app label component (works the same for app and policy)
            <ResourceLabels
                appRepos={[policySource]}
                showSubscriptionAttributes={true}
                isArgoApp={false}
                translation={t}
            />
        )
    } else {
        return getSourceText(policySource, isExternal, t)
    }
}

export function getPolicyDetailSourceLabel(
    policy: Policy,
    helmReleases: HelmRelease[],
    channels: Channel[],
    subscriptions: Subscription[],
    t: TFunction
) {
    const isExternal = resolveExternalStatus(policy)
    const policySource = resolveSource(policy, helmReleases, channels, subscriptions)
    if (isExternal) {
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {policySource ? (
                    <>
                        <p style={{ paddingRight: '.25rem' }}>{t('Managed by')}</p>
                        {getSource(policySource, isExternal, t)}
                    </>
                ) : (
                    <p>{t('Managed externally')}</p>
                )}
            </div>
        )
    }
}

export function PolicySetList(props: { policySets: PolicySet[] }) {
    const { policySets } = props
    const [showAll, setShowAll] = useState(policySets.length - 1 > 1 ? false : true)

    let policySetLinks = useMemo(
        () =>
            policySets.map((policySetMatch: PolicySet, idx: number) => {
                const urlSearch = encodeURIComponent(
                    `names=["${policySetMatch.metadata.name}"]&namespaces=["${policySetMatch.metadata.namespace}"]`
                )
                return (
                    <div key={`${idx}-${policySetMatch.metadata.name}`}>
                        <Link
                            to={{
                                pathname: NavigationPath.policySets,
                                search: `?${urlSearch}`,
                                state: {
                                    from: NavigationPath.policies,
                                },
                            }}
                        >
                            {policySetMatch.metadata.name}
                        </Link>
                        {/* separate PolicySet links by comma */}
                        {(showAll && idx === policySets.length - 1) || (!showAll && idx == 1) ? '' : ', '}
                    </div>
                )
            }),
        [policySets, showAll]
    )

    if (policySetLinks.length > 2) {
        if (!showAll) {
            policySetLinks = policySetLinks.slice(0, 2)
        }
        policySetLinks.push(
            <Chip key={'overflow-btn'} isOverflowChip component={'button'} onClick={() => setShowAll(!showAll)}>
                {!showAll ? 'more' : 'Show less'}
            </Chip>
        )
    }
    return <div>{policySetLinks}</div>
}
