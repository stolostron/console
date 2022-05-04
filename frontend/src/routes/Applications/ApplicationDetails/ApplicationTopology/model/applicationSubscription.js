/* Copyright Contributors to the Open Cluster Management project */

import { cloneDeep, get, isEmpty } from 'lodash'
import { listResources } from '../../../../../resources/utils/resource-request'
import { getSubscriptionAnnotations, isLocalSubscription } from '../../../helpers/subscriptions'

const EVERYTHING_CHANNEL = '__ALL__/__ALL__//__ALL__/__ALL__'
export const ALL_SUBSCRIPTIONS = '__ALL__/SUBSCRIPTIONS__'
const NAMESPACE = 'metadata.namespace'

export const getSubscriptionApplication = async (model, app, selectedChannel, recoilStates) => {
    // get subscriptions to channels (pipelines)
    const subscriptionNames = getSubscriptionAnnotations(app)
    if (subscriptionNames.length > 0) {
        // filter local hub subscription
        const filteredSubscriptions = subscriptionNames.filter((subscriptionName) => {
            return !isLocalSubscription(subscriptionName, subscriptionNames)
        })
        const subscriptions = cloneDeep(getResources(filteredSubscriptions, recoilStates.subscriptions))

        // what subscriptions does user want to see
        model.channels = []
        model.subscriptions = []
        model.allSubscriptions = subscriptions
        model.allChannels = []
        model.allClusters = []
        model.reports = []

        // get all the channels and find selected subscription from selected channel
        let selectedSubscriptions = getAllChannels(subscriptions, model.channels, selectedChannel)

        // pick subscription based on channel requested by ui or 1st by default
        model.activeChannel = selectedChannel ? selectedChannel : getChannelName(selectedSubscriptions[0])
        // get all requested subscriptions
        selectedSubscriptions = selectedChannel === ALL_SUBSCRIPTIONS ? subscriptions : selectedSubscriptions

        // get reports, hooks and rules
        const { channelsMap, rulesMap, preHooksMap, postHooksMap } = buildSubscriptionMaps(
            selectedSubscriptions,
            model.subscriptions
        )
        selectedSubscriptions.forEach((subscription) => {
            const report =
                recoilStates.subscriptionReports &&
                recoilStates.subscriptionReports.find((report) => {
                    return (
                        get(report, 'metadata.namespace') === get(subscription, 'metadata.namespace') &&
                        get(report, 'metadata.name') === get(subscription, 'metadata.name')
                    )
                })
            if (report) {
                subscription.report = report
                model.reports.push(subscription.report)
            }
        })

        await getAppHooks(preHooksMap, true)
        await getAppHooks(postHooksMap, false)
        getAppRules(rulesMap, model.allClusters, recoilStates.placementRules)

        // get all channels
        getAllAppChannels(model.allChannels, subscriptions, recoilStates.channels)

        getAppChannels(channelsMap, model.allChannels)
    }
    return model
}

const getResources = (names, resources) => {
    const set = new Set(names)
    return resources.filter((resource) => {
        return set.has(`${get(resource, 'metadata.namespace')}/${get(resource, 'metadata.name')}`)
    })
}

const getAllChannels = (subscriptions, channels, selectedChannel) => {
    let selectedSubscriptions = subscriptions.length > 0 ? [subscriptions[0]] : []
    subscriptions.forEach((subscription) => {
        if (get(subscription, 'spec.channel')) {
            const subscriptionChannel = getChannelName(subscription)
            channels.push(subscriptionChannel)
            if (selectedChannel === subscriptionChannel) {
                selectedSubscriptions = [subscription]
            }
        }
    })
    // add an ALL channel?
    if (channels.length > 1) {
        channels.unshift(EVERYTHING_CHANNEL)
        // set default selectedSubscription when topology first render
        if (!selectedSubscriptions) {
            selectedSubscriptions = subscriptions.length > 0 ? [subscriptions[0]] : null
        }
    }
    // renders all subscriptions when selected all subscriptions
    if (selectedChannel === '__ALL__/__ALL__//__ALL__/__ALL__') {
        selectedSubscriptions = subscriptions
    }
    return selectedSubscriptions
}

const getChannelName = (subscription) => {
    const { metadata = {}, deployablePaths: paths, isChucked } = subscription
    const { name: nm, namespace: ns } = metadata
    const chn = get(subscription, 'spec.channel')
    return `${ns}/${nm}//${chn}${getSubChannelName(paths, isChucked)}`
}

// if channel has sub channels, get subchannel name
export const getSubChannelName = (paths, isChucked) => {
    if (isChucked) {
        const getName = (rname) => {
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

const buildSubscriptionMaps = (subscriptions, modelSubscriptions) => {
    const rulesMap = {}
    const channelsMap = {}
    const postHooksMap = {}
    const preHooksMap = {}
    let arr = null

    subscriptions.forEach((subscription) => {
        modelSubscriptions.push(subscription)

        // get post hooks
        const postHooks = get(subscription, 'status.ansiblejobs.posthookjobshistory', [])
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
        const preHooks = get(subscription, 'status.ansiblejobs.prehookjobshistory', [])
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
        const [chnNamespace, chnName] = get(subscription, 'spec.channel', '').split('/')
        if (chnNamespace && chnName) {
            arr = channelsMap[chnNamespace]
            if (!arr) {
                channelsMap[chnNamespace] = []
                arr = channelsMap[chnNamespace]
            }
            arr.push({ chnName, subscription })
            subscription.channels = []
        }

        // ditto for rules
        const ruleNamespace = get(subscription, NAMESPACE)
        get(subscription, 'spec.placement.placementRef.name', '')
            .split(',')
            .forEach((ruleName) => {
                if (ruleName) {
                    arr = rulesMap[ruleNamespace]
                    if (!arr) {
                        rulesMap[ruleNamespace] = []
                        arr = rulesMap[ruleNamespace]
                    }
                    arr.push({ ruleName, subscription })
                    subscription.rules = []
                }
            })
    })
    return {
        channelsMap,
        rulesMap,
        preHooksMap,
        postHooksMap,
    }
}

const getAppRules = (rulesMap, allClusters, placementRules) => {
    Object.entries(rulesMap).forEach(([namespace, values]) => {
        // stuff rules into subscriptions that use them
        placementRules
            .filter((rule) => {
                return get(rule, 'metadata.namespace') === namespace
            })
            .forEach((rule) => {
                const name = get(rule, 'metadata.name')
                values.forEach(({ ruleName, subscription }) => {
                    if (name === ruleName) {
                        subscription.rules.push(rule)
                        const clusters = get(rule, 'status.decisions', [])
                        clusters.forEach((cluster) => {
                            // get cluster name
                            const clusterName = get(cluster, 'clusterName')
                            if (clusterName && allClusters.indexOf(clusterName) === -1) {
                                allClusters.push(clusterName)
                            }
                        })
                    }
                })
            })
    })
}

// get all channels for all subscriptions
// this is used to build the subscription cards information
const getAllAppChannels = (appAllChannels, allSubscriptions, channels) => {
    // get all channels information
    const channelsMap = {}
    allSubscriptions.forEach((subscription) => {
        const chnlData = get(subscription, 'spec.channel', '').split('/')
        if (chnlData.length === 2) {
            // eslint-disable-next-line prefer-destructuring
            channelsMap[chnlData[0]] = chnlData[1]
        }
    })
    Object.entries(channelsMap).forEach(([channelNS, channelName]) => {
        channels
            .filter((channel) => {
                return get(channel, 'metadata.namespace') === channelNS && get(channel, 'metadata.name') === channelName
            })
            .forEach((channel) => {
                appAllChannels.push(channel)
            })
    })
}

const getAppHooks = async (hooks, isPreHooks) => {
    if (!isEmpty(hooks)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const requests = Object.entries(hooks).map(async ([namespace, values]) => {
            let response
            try {
                response = await listResources({
                    apiVersion: 'tower.ansible.com/v1alpha1',
                    kind: 'AnsibleJob',
                }).promise
            } catch (err) {
                console.error('Error listing resource:', err)
            }

            if (response) {
                response.forEach((deployable) => {
                    const name = get(deployable, 'metadata.name')
                    values.forEach(({ deployableName, subscription }) => {
                        if (name === deployableName) {
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

const longestCommonSubstring = (str1, str2) => {
    let sequence = ''
    const str1Length = str1.length
    const str2Length = str2.length
    const num = new Array(str1Length)
    let maxlen = 0
    let lastSubsBegin = 0
    let i = 0
    let j = 0

    // create matrix
    while (i < str1Length) {
        const subArray = new Array(str2Length)
        j = 0
        while (j < str2Length) {
            subArray[j] = 0
            j += 1
        }
        num[i] = subArray
        i += 1
    }

    // search matrix
    let thisSubsBegin = null
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

function getAppChannels(channelsMap, allChannels) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.entries(channelsMap).forEach(([_namespace, values]) => {
        allChannels.forEach((channel) => {
            const name = get(channel, 'metadata.name')
            values.forEach(({ chnName, subscription }) => {
                if (name === chnName) {
                    subscription.channels.push(channel)
                }
            })
        })
    })
}
