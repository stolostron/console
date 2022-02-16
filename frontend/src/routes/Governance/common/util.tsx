/* Copyright Contributors to the Open Cluster Management project */
import { Chip } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { channelsState, helmReleaseState, subscriptionsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import {
    Channel,
    HelmRelease,
    Placement,
    PlacementBinding,
    PlacementKind,
    PlacementRule,
    PlacementRuleKind,
    Policy,
    PolicySet,
    Subscription,
} from '../../../resources'
import ResourceLabels from '../../Applications/components/ResourceLabels'

export function getPlacementBindingsForResource(resource: Policy | PolicySet, placementBindings: PlacementBinding[]) {
    return placementBindings
        .filter((placementBinding) => placementBinding.metadata.namespace === resource.metadata.namespace)
        .filter((placementBinding) => placementBinding.subjects?.find((subject) => subject.kind === resource.kind))
        .filter((placementBinding) =>
            placementBinding.subjects?.find((subject) => subject.name === resource.metadata.name)
        )
}

export function getPlacementsForResource(
    resource: Policy | PolicySet,
    resourceBindings: PlacementBinding[],
    placements: Placement[]
) {
    return placements
        .filter((placement) => placement.metadata.namespace === resource.metadata.namespace)
        .filter((placement) =>
            resourceBindings.find(
                (placementBinding: PlacementBinding) =>
                    placementBinding.placementRef.kind === PlacementKind &&
                    placementBinding.placementRef.name === placement.metadata.name
            )
        )
}

export function getPlacementRulesForResource(
    resource: Policy | PolicySet,
    resourceBindings: PlacementBinding[],
    placementRules: PlacementRule[]
) {
    return placementRules
        .filter((placementRule) => placementRule.metadata.namespace === resource.metadata.namespace)
        .filter((placementRule) =>
            resourceBindings.find(
                (placementBinding: PlacementBinding) =>
                    placementBinding.placementRef.kind === PlacementRuleKind &&
                    placementBinding.placementRef.name === placementRule.metadata.name
            )
        )
}

export function resolveExternalStatus(policy: Policy) {
    const knownExternalManagers = ['multicluster-operators-subscription', 'argocd-application-controller']
    const managedFields = policy.metadata.managedFields ?? []
    return managedFields.some((mf) => knownExternalManagers.includes(mf.manager ?? 'none'))
}

function getHelmReleaseMap() {
    const [helmReleases] = useRecoilState(helmReleaseState)
    const resourceMap = new Map()
    helmReleases.forEach((helmRelease: HelmRelease) => {
        resourceMap.set(`${helmRelease.metadata.namespace}/${helmRelease.metadata.name}`, helmRelease)
    })
    return resourceMap
}
function getSubscriptionMap() {
    const [subscriptions] = useRecoilState(subscriptionsState)
    const resourceMap = new Map()
    subscriptions.forEach((subscription: Subscription) => {
        resourceMap.set(`${subscription.metadata.namespace}/${subscription.metadata.name}`, subscription)
    })
    return resourceMap
}
function getChannelMap() {
    const [channels] = useRecoilState(channelsState)
    const resourceMap = new Map()
    channels.forEach((channel: Channel) => {
        resourceMap.set(`${channel.metadata.namespace}/${channel.metadata.name}`, channel)
    })
    return resourceMap
}

// This function may need some revision/testing
export function resolveSource(policy: Policy) {
    const getAnnotations = (item: any) => item.metadata.annotations ?? {}
    const getHostingSubscription = (annotations: any) =>
        annotations['apps.open-cluster-management.io/hosting-subscription']
    const parentAnnotations = getAnnotations(policy)
    let hostingSubscription = getHostingSubscription(parentAnnotations)
    if (!hostingSubscription) {
        // check if this policy was deployed by a Helm release
        const releaseNamespace = parentAnnotations['meta.helm.sh/release-namespace']
        const releaseName = parentAnnotations['meta.helm.sh/release-name']
        if (releaseNamespace && releaseName) {
            const helmReleaseMap = getHelmReleaseMap()
            const helmRelease = helmReleaseMap.get(`${releaseNamespace}/${releaseName}`)
            const helmReleaseAnnotations = getAnnotations(helmRelease)
            hostingSubscription = getHostingSubscription(helmReleaseAnnotations)
        }
    }
    if (hostingSubscription) {
        const subscriptionMap = getSubscriptionMap()
        const channelMap = getChannelMap()
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

export function getSourceText(policySource: any, isExternal: boolean) {
    const { t } = useTranslation()
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

export function getSource(policySource: any, isExternal: boolean) {
    const { t } = useTranslation()
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
        return getSourceText(policySource, isExternal)
    }
}

export function getPolicyDetailSourceLabel(policy: Policy) {
    const { t } = useTranslation()
    const isExternal = resolveExternalStatus(policy)
    const policySource = resolveSource(policy)
    if (isExternal) {
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {policySource ? (
                    <>
                        <p style={{ paddingRight: '.25rem' }}>{t('Managed by')}</p>
                        {getSource(policySource, isExternal)}
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
        [policySets]
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
