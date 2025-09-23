/* Copyright Contributors to the Open Cluster Management project */

import { Placement, PlacementKind, PlacementRule, PlacementRuleKind, Subscription } from '../../../../../resources'
import { listResources } from '../../../../../resources/utils/resource-request'
import type { IResource } from '../../../../../resources/resource'
import { getSubscriptionAnnotations, isLocalSubscription } from '../../../helpers/subscriptions'
import type {
  ChannelKind,
  PlacementDecisionKind,
  SubscriptionApplicationModel,
  SubscriptionKind,
  SubscriptionReport,
  SubscriptionChannelsMap,
  SubscriptionDecisionsMap,
  SubscriptionHooksMap,
  SubscriptionPlacementsMap,
  RecoilStates,
} from '../types'

const EVERYTHING_CHANNEL = '__ALL__/__ALL__//__ALL__/__ALL__'
export const ALL_SUBSCRIPTIONS = '__ALL__/SUBSCRIPTIONS__'

/**
 * Build a Subscription-focused application model:
 * - Resolve subscriptions referenced by the ACM Application annotations
 * - Populate channels, pre/post Ansible hooks, placement decisions and resources
 * - Determine selected channel view and aggregate cluster list
 */
export const getSubscriptionApplication = async (
  model: SubscriptionApplicationModel,
  app: IResource,
  selectedChannel: string | undefined,
  recoilStates: RecoilStates
): Promise<SubscriptionApplicationModel> => {
  // get subscriptions to channels (pipelines)
  const subscriptionNames = getSubscriptionAnnotations(app) as string[]
  if (subscriptionNames.length > 0) {
    // filter local hub subscription
    const filteredSubscriptions = subscriptionNames.filter((subscriptionName) => {
      return !isLocalSubscription(subscriptionName, subscriptionNames)
    })
    const subscriptions = structuredClone(
      getResources(filteredSubscriptions, (recoilStates.subscriptions || []) as Subscription[])
    )
    subscriptions.sort((a, b) => {
      const aName = String(a?.metadata?.name ?? '')
      const bName = String(b?.metadata?.name ?? '')
      return aName.localeCompare(bName)
    })

    // what subscriptions does user want to see
    model.channels = []
    model.subscriptions = []
    model.allSubscriptions = subscriptions as unknown as SubscriptionKind[]
    model.allChannels = []
    model.allClusters = []
    model.reports = []

    // get all the channels and find selected subscription from selected channel
    let selectedSubscriptions = getAllChannels(subscriptions, model.channels, selectedChannel)

    // pick subscription based on channel requested by ui or 1st by default
    model.activeChannel = selectedChannel
      ? selectedChannel
      : getChannelName(selectedSubscriptions[0] as unknown as Subscription)
    // get all requested subscriptions
    selectedSubscriptions =
      selectedChannel === ALL_SUBSCRIPTIONS ? (subscriptions as unknown as SubscriptionKind[]) : selectedSubscriptions

    // get reports, hooks and rules
    const { channelsMap, decisionsMap, placementsMap, preHooksMap, postHooksMap } = buildSubscriptionMaps(
      selectedSubscriptions,
      model.subscriptions
    )
    selectedSubscriptions.forEach((subscription) => {
      const report = (recoilStates.subscriptionReports as SubscriptionReport[] | undefined)?.find((report) => {
        return (
          (report?.metadata as any)?.namespace === (subscription?.metadata as any)?.namespace &&
          (report?.metadata as any)?.name === (subscription?.metadata as any)?.name
        )
      })
      if (report) {
        subscription.report = report
        model.reports.push(subscription.report as Record<string, unknown>)
      }
    })

    await getAppHooks(preHooksMap, true)
    await getAppHooks(postHooksMap, false)
    getAppDecisions(
      decisionsMap,
      model.allClusters,
      recoilStates.placementDecisions as unknown as PlacementDecisionKind[]
    )
    getAppPlacements(
      placementsMap,
      (recoilStates.placements as Placement[]) || [],
      (recoilStates.placementRules as PlacementRule[]) || []
    )

    // get all channels
    getAllAppChannels(model.allChannels, subscriptions, (recoilStates.channels as unknown as ChannelKind[]) || [])

    getAppChannels(channelsMap, model.allChannels)
  }
  return model
}

/**
 * Filter `resources` to those whose `namespace/name` pair is present in `names`.
 */
const getResources = (names: string[], resources: Subscription[]): Subscription[] => {
  const set = new Set(names)
  return resources.filter((resource) => {
    return set.has(`${resource?.metadata?.namespace}/${resource?.metadata?.name}`)
  })
}

/**
 * Collect channel keys for subscriptions and pick the selected ones.
 * Adds an ALL pseudo-channel when multiple channels exist.
 */
const getAllChannels = (
  subscriptions: Subscription[],
  channels: string[],
  selectedChannel: string | undefined
): SubscriptionKind[] => {
  let selectedSubscriptions: SubscriptionKind[] | [] | null =
    subscriptions.length > 0 ? [subscriptions[0] as unknown as SubscriptionKind] : []
  subscriptions.forEach((subscription) => {
    if (subscription?.spec?.channel) {
      const subscriptionChannel = getChannelName(subscription)
      channels.push(subscriptionChannel)
      if (selectedChannel === subscriptionChannel) {
        selectedSubscriptions = [subscription as unknown as SubscriptionKind]
      }
    }
  })
  // add an ALL channel?
  if (channels.length > 1) {
    channels.unshift(EVERYTHING_CHANNEL)
    // set default selectedSubscription when topology first render
    if (!selectedSubscriptions) {
      selectedSubscriptions = subscriptions.length > 0 ? [subscriptions[0] as unknown as SubscriptionKind] : null
    }
  }
  // renders all subscriptions when selected all subscriptions
  if (selectedChannel === EVERYTHING_CHANNEL) {
    selectedSubscriptions = subscriptions as unknown as SubscriptionKind[]
  }
  return (selectedSubscriptions || []) as SubscriptionKind[]
}

/**
 * Build a stable channel display key for a subscription including optional sub-channel suffix.
 */
const getChannelName = (subscription: Subscription): string => {
  const {
    metadata = {} as any,
    deployablePaths: paths,
    isChucked,
  } = subscription as Subscription & {
    deployablePaths?: string[]
    isChucked?: boolean
  }
  const { name: nm, namespace: ns } = metadata as { name: string; namespace: string }
  const chn = subscription?.spec?.channel
  return `${ns}/${nm}//${chn}${getSubChannelName(paths, isChucked)}`
}

/**
 * If channel uses chunked subpaths, compute a succinct subchannel label suffix.
 */
export const getSubChannelName = (paths?: string[], isChucked?: boolean): string => {
  if (isChucked && paths && paths.length > 0) {
    const getName = (rname: string): string => {
      let [, name] = rname.split('/')
      name = name.replace(/.[\d.]+$/, '')
      return name
    }

    // get first and last path
    const len = paths.length - 1
    let begName = getName(paths[0])
    let endName = getName(paths[len])

    // find longest common string between paths
    const common = longestCommonSubstring(begName, endName)

    // replace common string in both paths
    begName = begName.replace(common, '')
    endName = endName.replace(common, '')
    return `///${begName}///${endName}`
  }
  return ''
}

/**
 * From the selected subscriptions, construct helper maps for hooks, channels, decisions, placements.
 * Also primes per-subscription arrays used downstream (channels, decisions, placements, hooks).
 */
const buildSubscriptionMaps = (
  subscriptions: SubscriptionKind[],
  modelSubscriptions: SubscriptionKind[]
): {
  decisionsMap: SubscriptionDecisionsMap
  channelsMap: SubscriptionChannelsMap
  placementsMap: SubscriptionPlacementsMap
  preHooksMap: SubscriptionHooksMap
  postHooksMap: SubscriptionHooksMap
} => {
  const decisionsMap: SubscriptionDecisionsMap = {}
  const channelsMap: SubscriptionChannelsMap = {}
  const placementsMap: SubscriptionPlacementsMap = {}
  const postHooksMap: SubscriptionHooksMap = {}
  const preHooksMap: SubscriptionHooksMap = {}
  let arr: any[] | null = null

  subscriptions.forEach((subscription) => {
    modelSubscriptions.push(subscription)

    // get post hooks
    const lastPosthookJob = (subscription?.status as unknown as { ansiblejobs?: { lastposthookjob?: string } })
      ?.ansiblejobs?.lastposthookjob as string | undefined
    const postHooks = lastPosthookJob ? [lastPosthookJob] : []
    postHooks.forEach((value) => {
      const [deployableNamespace, deployableName] = value.split('/')
      if (deployableNamespace && deployableName) {
        arr = postHooksMap[deployableNamespace]
        if (!arr) {
          postHooksMap[deployableNamespace] = []
          arr = postHooksMap[deployableNamespace]
        }
        arr.push({ deployableName, subscription })
      }
    })
    if (postHooks) {
      subscription.posthooks = []
    }

    // get pre hooks
    const lastPrehookJob = (subscription?.status as any)?.ansiblejobs?.lastprehookjob as string | undefined
    const preHooks = lastPrehookJob ? [lastPrehookJob] : []
    preHooks.forEach((value) => {
      const [deployableNamespace, deployableName] = value.split('/')
      if (deployableNamespace && deployableName) {
        arr = preHooksMap[deployableNamespace]
        if (!arr) {
          preHooksMap[deployableNamespace] = []
          arr = preHooksMap[deployableNamespace]
        }
        arr.push({ deployableName, subscription })
      }
    })
    if (preHooks) {
      subscription.prehooks = []
    }

    // ditto for channels
    const [chnNamespace, chnName] = (subscription?.spec?.channel ?? '').split('/')
    if (chnNamespace && chnName) {
      arr = channelsMap[chnNamespace]
      if (!arr) {
        channelsMap[chnNamespace] = []
        arr = channelsMap[chnNamespace]
      }
      arr.push({ chnName, subscription })
      subscription.channels = []
    }

    const ruleNamespace = subscription?.metadata?.namespace as string

    ;(subscription?.spec?.placement?.placementRef?.name ?? '').split(',').forEach((ruleName) => {
      // ditto for placementDecisions
      if (ruleName) {
        arr = decisionsMap[ruleNamespace]
        if (!arr) {
          decisionsMap[ruleNamespace] = []
          arr = decisionsMap[ruleNamespace]
        }
        arr.push({ ruleName, subscription })
        subscription.decisions = []
        // ditto for placements and placmentrules

        arr = placementsMap[ruleNamespace]
        if (!arr) {
          placementsMap[ruleNamespace] = []
          arr = placementsMap[ruleNamespace]
        }
        arr.push({ ruleName, subscription })
        subscription.placements = []
      }
    })
  })
  return {
    channelsMap,
    decisionsMap,
    placementsMap,
    preHooksMap,
    postHooksMap,
  }
}

/**
 * For each subscription, find and attach Placement or PlacementRule objects by rule name/namespace.
 */
const getAppPlacements = (
  placementsMap: SubscriptionPlacementsMap,
  placements: Placement[],
  placementRules: PlacementRule[]
): void => {
  Object.entries(placementsMap).forEach(([namespace, values]) => {
    // stuff placements or placement rules into subscriptions that use them
    values.forEach(({ ruleName, subscription }) => {
      const placementRef = subscription?.spec?.placement?.placementRef as { kind?: string } | undefined
      if (placementRef) {
        const { kind } = placementRef
        if (kind === PlacementRuleKind) {
          const foundPR = placementRules.find(
            (pr) => pr.metadata.name === ruleName && pr.metadata.namespace === namespace
          )
          if (foundPR) {
            ;(subscription.placements || (subscription.placements = [])).push(foundPR)
          }
        } else if (kind === PlacementKind) {
          const foundPlacement = placements.find(
            (placement) => placement.metadata.name === ruleName && placement.metadata.namespace === namespace
          )
          if (foundPlacement) {
            ;(subscription.placements || (subscription.placements = [])).push(foundPlacement)
          }
        }
      }
    })
  })
}

/**
 * Resolve PlacementDecisions per subscription and aggregate unique cluster names into `allClusters`.
 */
const getAppDecisions = (
  decisionsMap: SubscriptionDecisionsMap,
  allClusters: string[],
  placementDecisions: PlacementDecisionKind[]
): void => {
  Object.entries(decisionsMap).forEach(([namespace, values]) => {
    // stuff rules into subscriptions that use them
    placementDecisions
      ?.filter((placementDecision) => {
        return placementDecision?.metadata?.namespace === namespace
      })
      .forEach((placementDecision) => {
        const name =
          placementDecision.metadata.labels?.['cluster.open-cluster-management.io/placement'] ||
          placementDecision.metadata.labels?.['cluster.open-cluster-management.io/placementrule']
        values.forEach(({ ruleName, subscription }) => {
          if (name === ruleName) {
            ;(subscription.decisions || (subscription.decisions = [])).push(placementDecision)
            const clusters = (placementDecision?.status?.decisions ?? []) as Array<{ clusterName?: string }>
            clusters.forEach((cluster) => {
              // get cluster name
              const clusterName = cluster?.clusterName as string | undefined
              if (clusterName && allClusters.indexOf(clusterName) === -1) {
                allClusters.push(clusterName)
              }
            })
          }
        })
      })
  })
}

/**
 * Get all channel resources referenced by the subscriptions in view.
 * Used to build the subscription cards information.
 */
const getAllAppChannels = (
  appAllChannels: ChannelKind[],
  allSubscriptions: Subscription[],
  channels: ChannelKind[]
): void => {
  // get all channels information
  const channelsMap: Record<string, string> = {}
  allSubscriptions.forEach((subscription) => {
    const chnlData = (subscription?.spec?.channel ?? '').split('/')
    if (chnlData.length === 2) {
      // eslint-disable-next-line prefer-destructuring
      channelsMap[chnlData[0]] = chnlData[1]
    }
  })
  Object.entries(channelsMap).forEach(([channelNS, channelName]) => {
    channels
      .filter((channel) => {
        return channel?.metadata?.namespace === channelNS && channel?.metadata?.name === channelName
      })
      .forEach((channel) => {
        appAllChannels.push(channel)
      })
  })
}

/**
 * Query AnsibleJob resources and attach matching pre/post hooks to subscriptions.
 */
const getAppHooks = async (hooks: SubscriptionHooksMap, isPreHooks: boolean): Promise<void[] | undefined> => {
  if (Object.keys(hooks).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const requests = Object.entries(hooks).map(async ([_namespace, values]) => {
      let response: any
      try {
        response = await listResources({
          apiVersion: 'tower.ansible.com/v1alpha1',
          kind: 'AnsibleJob',
        }).promise
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error listing resource:', err)
      }

      if (response) {
        response.forEach((deployable: any) => {
          const hookName = deployable?.metadata?.name as string | undefined
          const hookNamespace = deployable?.metadata?.namespace as string | undefined
          values.forEach(({ deployableName, subscription }) => {
            const subNS = subscription?.metadata?.namespace as string | undefined
            if (hookName === deployableName && hookNamespace === subNS) {
              if (isPreHooks) {
                if (!subscription.prehooks) {
                  subscription.prehooks = []
                }
                subscription.prehooks.push(deployable)
              } else {
                if (!subscription.posthooks) {
                  subscription.posthooks = []
                }
                subscription.posthooks.push(deployable)
              }
            }
          })
        })
      }
    })
    return Promise.all(requests)
  }
}

/**
 * Compute the longest common contiguous substring between two strings.
 */
const longestCommonSubstring = (str1: string, str2: string): string => {
  let sequence = ''
  const str1Length = str1.length
  const str2Length = str2.length
  const num: number[][] = new Array(str1Length)
  let maxlen = 0
  let lastSubsBegin = 0
  let i = 0
  let j = 0

  // create matrix
  while (i < str1Length) {
    const subArray: number[] = new Array(str2Length)
    j = 0
    while (j < str2Length) {
      subArray[j] = 0
      j += 1
    }
    num[i] = subArray
    i += 1
  }

  // search matrix
  let thisSubsBegin: number | null = null
  i = 0
  while (i < str1Length) {
    j = 0
    while (j < str2Length) {
      if (str1[i] !== str2[j]) {
        num[i][j] = 0
      } else {
        if (i === 0 || j === 0) {
          num[i][j] = 1
        } else {
          num[i][j] = 1 + num[i - 1][j - 1]
        }
        if (num[i][j] > maxlen) {
          maxlen = num[i][j]
          thisSubsBegin = i - num[i][j] + 1
          if (lastSubsBegin === thisSubsBegin) {
            sequence += str1[i]
          } else {
            lastSubsBegin = thisSubsBegin
            sequence = str1.substr(lastSubsBegin, i + 1 - lastSubsBegin)
          }
        }
      }
      j += 1
    }
    i += 1
  }
  return sequence
}

/**
 * For each channel namespace, push matching channel resources into each subscription's `channels` array.
 */
function getAppChannels(channelsMap: SubscriptionChannelsMap, allChannels: ChannelKind[]): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.entries(channelsMap).forEach(([_namespace, values]) => {
    allChannels.forEach((channel) => {
      const name = channel?.metadata?.name as string | undefined
      values.forEach(({ chnName, subscription }) => {
        if (name === chnName) {
          ;(subscription.channels || (subscription.channels = [])).push(channel)
        }
      })
    })
  })
}

export default getSubscriptionApplication
