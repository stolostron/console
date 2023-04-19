/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/rules-of-hooks */
import { Chip } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import {
  Channel,
  HelmRelease,
  ManagedCluster,
  Placement,
  PlacementBinding,
  PlacementRule,
  Policy,
  PolicySet,
  PolicyTemplate,
  PolicyAutomation,
  reconcileResources,
  Subscription,
  IResource,
  Secret,
} from '../../../resources'
import { PlacementDecision } from '../../../resources/placement-decision'
import ResourceLabels from '../../Applications/components/ResourceLabels'
import { IAlertContext } from '../../../ui-components'
import { useTranslation } from '../../../lib/acm-i18next'

export interface PolicyCompliance {
  policyName: string
  policyNamespace: string
  clusterCompliance: { clusterName: string; compliance: 'Compliant' | 'NonCompliant' | 'Unknown' }[]
}

export interface ClusterPolicies {
  policyName: string
  policyNamespace: string
  compliance?: string
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

export function getPolicyForCluster(cluster: ManagedCluster, policies: Policy[]) {
  const clusterPolicies: ClusterPolicies[] = []
  for (const policy of policies) {
    const policyStatus = policy.status?.status
    if (policyStatus) {
      for (const status of policyStatus) {
        if (status.clustername === cluster.metadata.name) {
          clusterPolicies.push({
            policyName: policy.metadata.name!,
            policyNamespace: policy.metadata.namespace!,
            compliance: status?.compliant ?? 'unknown',
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
  const policySetPolicies = getPolicySetPolicies(policies, policySet)

  const policyCompliance: PolicyCompliance[] = []
  for (const placementDecision of policySetPlacementDecisions) {
    for (const decision of placementDecision.status?.decisions || []) {
      for (const policy of policySetPolicies) {
        const policyIdx = policyCompliance.findIndex((p) => p.policyName === policy.metadata.name!)
        const policyClusterStatus = policy.status?.status?.find(
          (clusterStatus) => clusterStatus.clustername === decision.clusterName
        )
        if (!policyClusterStatus) {
          if (policyIdx < 0) {
            policyCompliance.push({
              policyName: policy.metadata.name ?? '',
              policyNamespace: policy.metadata.namespace ?? '',
              clusterCompliance: [],
            })
          }
        } else if (policyClusterStatus?.compliant === 'NonCompliant') {
          if (policyIdx < 0) {
            policyCompliance.push({
              policyName: policy.metadata.name ?? '',
              policyNamespace: policy.metadata.namespace ?? '',
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
              policyName: policy.metadata.name ?? '',
              policyNamespace: policy.metadata.namespace ?? '',
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
        } else if (!policyClusterStatus?.compliant) {
          if (policyIdx < 0) {
            policyCompliance.push({
              policyName: policy.metadata.name ?? '',
              policyNamespace: policy.metadata.namespace ?? '',
              clusterCompliance: [
                {
                  clusterName: decision.clusterName,
                  compliance: 'Unknown',
                },
              ],
            })
          } else {
            policyCompliance[policyIdx].clusterCompliance.push({
              clusterName: decision.clusterName,
              compliance: 'Unknown',
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
  const policySetPolicies = getPolicySetPolicies(policies, policySet)
  const clustersCompliance: Record<string, 'Compliant' | 'NonCompliant' | 'Pending' | 'Unknown'> = {}
  for (const placementDecision of policySetPlacementDecisions) {
    for (const decision of placementDecision.status?.decisions || []) {
      if (clustersCompliance[decision.clusterName] === 'NonCompliant') {
        continue
      }
      for (const policy of policySetPolicies) {
        if (policy.spec.disabled) {
          continue
        }
        const policyClusterStatus = policy.status?.status?.find(
          (clusterStatus) => clusterStatus.clustername === decision.clusterName
        )
        if (policyClusterStatus?.compliant === 'NonCompliant') {
          clustersCompliance[decision.clusterName] = 'NonCompliant'
        } else if (!policyClusterStatus?.compliant && clustersCompliance[decision.clusterName] !== 'NonCompliant') {
          clustersCompliance[decision.clusterName] = 'Unknown'
        } else if (
          policyClusterStatus?.compliant === 'Pending' &&
          clustersCompliance[decision.clusterName] !== 'NonCompliant' &&
          clustersCompliance[decision.clusterName] !== 'Unknown'
        ) {
          clustersCompliance[decision.clusterName] = 'Pending'
        } else if (
          policyClusterStatus?.compliant === 'Compliant' &&
          clustersCompliance[decision.clusterName] !== 'NonCompliant' &&
          clustersCompliance[decision.clusterName] !== 'Unknown'
        ) {
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
  const pending: string[] = []
  const unknown: string[] = []
  for (const clusterName in clustersCompliance) {
    switch (clustersCompliance[clusterName]) {
      case 'Compliant':
        compliant.push(clusterName)
        break
      case 'NonCompliant':
        nonCompliant.push(clusterName)
        break
      case 'Pending':
        pending.push(clusterName)
        break
      case 'Unknown':
        unknown.push(clusterName)
        break
    }
  }

  return { compliant, nonCompliant, pending, unknown }
}

export function resolveExternalStatus(policy: Policy) {
  const knownExternalManagerPatterns = [/^multicluster-operators-subscription$/, /argocd/]
  const managedFields = policy.metadata.managedFields ?? []
  return managedFields.some((mf) => knownExternalManagerPatterns.some((p) => p.test(mf.manager ?? 'none')))
}

function getHelmReleaseMap(helmReleases: HelmRelease[]) {
  const resourceMap = new Map()
  helmReleases.forEach((helmRelease: HelmRelease) => {
    resourceMap.set(`${helmRelease.metadata.namespace}/${helmRelease.metadata.name}`, helmRelease)
  })
  return resourceMap
}
function getSubscriptionMap(subscriptions: Subscription[]) {
  const resourceMap: Record<string, Subscription | undefined> = {}
  subscriptions.forEach((subscription: Subscription) => {
    resourceMap[`${subscription.metadata.namespace}/${subscription.metadata.name}`] = subscription
  })
  return resourceMap
}
function getChannelMap(channels: Channel[]) {
  const channelMap: Record<string, Channel | undefined> = {}
  channels.forEach((channel: Channel) => {
    channelMap[`${channel.metadata.namespace}/${channel.metadata.name}`] = channel
  })
  return channelMap
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
    const subscription = subscriptionMap[hostingSubscription]
    const channel = channelMap[subscription?.spec.channel ?? '']
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
      <ResourceLabels appRepos={[policySource]} showSubscriptionAttributes={true} isArgoApp={false} translation={t} />
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
  const { t } = useTranslation()
  let policySetLinks = useMemo(
    () =>
      policySets.map((policySetMatch: PolicySet, idx: number) => {
        const urlSearch = encodeURIComponent(
          `search={"name":["${policySetMatch.metadata.name}"],"namespace":["${policySetMatch.metadata.namespace}"]}`
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
        {!showAll ? t('more') : t('Show less')}
      </Chip>
    )
  }
  return <div>{policySetLinks}</div>
}

export function getPolicySetPolicies(policies: Policy[], policySet: PolicySet) {
  const policyNameMap = policySet.spec.policies.reduce((policyNameMap, currentValue) => {
    policyNameMap[currentValue] = true
    return policyNameMap
  }, {} as Record<string, true>)

  return policies.filter(
    (policy) => policyNameMap[policy.metadata.name!] && policy.metadata.namespace === policySet.metadata.namespace
  )
}

export function getPolicyRemediation(policy: Policy | undefined) {
  if (!policy) {
    return ''
  }
  if (policy.spec?.remediationAction) {
    return policy.spec.remediationAction
  }
  const templates = policy.spec['policy-templates']
  let remediationAggregation = '-'
  templates?.forEach((template: PolicyTemplate) => {
    const templateRemediation = template.objectDefinition.spec.remediationAction
    if (remediationAggregation === 'inform/enforce') {
      return
    } else if (remediationAggregation !== '-' && remediationAggregation !== templateRemediation) {
      remediationAggregation = 'inform/enforce'
      return
    } else if (remediationAggregation !== templateRemediation && templateRemediation) {
      remediationAggregation = templateRemediation
      return
    }
  })
  return remediationAggregation
}

export function getPolicyDescription(policy: Policy | undefined) {
  if (!policy) {
    return ''
  }

  const annotations = policy.metadata.annotations
  if (annotations && annotations['policy.open-cluster-management.io/description']) {
    return formatDescriptionForDropdown(annotations['policy.open-cluster-management.io/description'])
  }

  return '-'
}

export function handlePolicyAutomationSubmit(
  data: any,
  secrets: Secret[],
  history: any,
  toast: IAlertContext,
  t: TFunction,
  currentPolicyAutomation?: PolicyAutomation
) {
  const resource = data as PolicyAutomation
  const resources: IResource[] = [resource]

  if (resource) {
    // Copy the cedential to the namespace of the policy
    const credToCopy: Secret[] = secrets.filter(
      (secret: Secret) =>
        secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
        secret.metadata.name === resource.spec.automationDef.secret
    )
    const credExists = credToCopy.find((cred) => cred.metadata.namespace === resource.metadata.namespace)
    if (!credExists) {
      // unshift so secret is created before the PolicyAutomation
      resources.unshift({
        ...credToCopy[0],
        metadata: {
          annotations: credToCopy[0].metadata.annotations,
          name: credToCopy[0].metadata.name,
          namespace: resource.metadata.namespace!,
          labels: {
            'cluster.open-cluster-management.io/type': 'ans',
            'cluster.open-cluster-management.io/copiedFromNamespace': credToCopy[0].metadata.namespace!,
            'cluster.open-cluster-management.io/copiedFromSecretName': credToCopy[0].metadata.name!,
          },
        },
      })
    }
  }
  const currentResources = currentPolicyAutomation ? [currentPolicyAutomation] : []
  return reconcileResources(resources, currentResources).then(() => {
    if (resource) {
      toast.addAlert({
        title: t('Policy automation created'),
        message: t('{{name}} was successfully created.', { name: resource.metadata?.name }),
        type: 'success',
        autoClose: true,
      })
    }
    history.push(window.history?.state?.state?.from ?? NavigationPath.policies)
  })
}

export function formatDescriptionForDropdown(desc: string) {
  const formattedDescription = []
  if (desc) {
    const descLines = desc.split(/\r?\n/)
    for (let i = 0; i < descLines.length; i++) {
      formattedDescription.push(<p>{descLines[i]}</p>)
    }
  }

  return formattedDescription
}
