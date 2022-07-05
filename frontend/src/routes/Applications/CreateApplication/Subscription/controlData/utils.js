/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.

 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'
import {
    getGitChannelBranches,
    getGitChannelPaths,
    listChannels,
    listProviderConnections,
} from '../../../../../resources'
import { getControlByID } from '../../../../../lib/temptifly-utils'
import SharedResourceWarning, { RESOURCE_TYPES } from '../components/SharedResourceWarning'

const clusterSelectorCheckbox = 'clusterSelector'
const existingRuleCheckbox = 'existingrule-checkbox'
const specPathname = 'spec.pathname'

export const loadExistingChannels = (type) => {
    return {
        query: () => {
            return listChannels().promise
        },
        loadingDesc: 'creation.app.loading.channels',
        setAvailable: setAvailableChannelSpecs.bind(null, type),
    }
}

export const loadExistingAnsibleProviders = () => {
    return {
        query: () => {
            return listProviderConnections().promise
        },
        loadingDesc: 'creation.app.loading.secrets',
        setAvailable: setAvailableSecrets.bind(null),
    }
}

export const getUniqueChannelName = (channelPath, groupControlData) => {
    //create a unique name for a new channel, based on path and type
    if (!channelPath || !groupControlData) {
        return ''
    }

    //get the channel type and append to url to make sure different type of channels are unique, yet using the same url
    const channelTypeSection = getControlByID(groupControlData, 'channelType')

    let channelTypeStr
    let channelType
    if (channelTypeSection) {
        channelTypeStr = _.get(channelTypeSection, 'active', [''])[0]
    }

    switch (channelTypeStr) {
        case 'github':
            channelType = 'g'
            break
        case 'helmrepo':
            channelType = 'h'
            break
        case 'objectstore':
            channelType = 'o'
            break
        default:
            channelType = 'ns'
    }

    let channelName = _.trim(channelPath)
    if (_.startsWith(channelName, 'https://')) {
        channelName = _.trimStart(channelName, 'https://')
    }
    if (_.startsWith(channelName, 'http://')) {
        channelName = _.trimStart(channelName, 'http://')
    }
    if (_.endsWith(channelName, '.git')) {
        channelName = _.trimEnd(channelName, '.git')
    }

    channelName = _.replace(channelName, /\./g, '')
    channelName = _.replace(channelName, /:/g, '')
    channelName = _.replace(channelName, /\//g, '-')

    channelName = _.trimEnd(channelName, '-')
    channelName = channelName.toLowerCase()

    //max name for ns or resources is 63 chars
    // trim channel name to max 58 char to allow a max of 63 char length
    //for the channel authentication (which is channelName-auth) object and channel ns (channelName-ns)
    if (channelName.length > 58) {
        channelName = channelName.substring(channelName.length - 56)
    }
    channelName = `${channelType}${channelName}`

    return channelName
}

// Find first control defining the same channel in the current app
export const findOriginalChannelControl = (globalControl, channelName, nameControl) => {
    const channelsControl = globalControl.find(({ id: idCtrl }) => idCtrl === 'channels')
    if (channelsControl) {
        //get all active channels and see if this channel name was created prior to this; reuse it if found
        const activeDataChannels = _.get(channelsControl, 'active', [])
        for (const channelInfo of activeDataChannels) {
            const channelNameInfo = channelInfo.find(({ id: idChannelInfo }) => idChannelInfo === 'channelName')
            if (channelNameInfo) {
                if (channelNameInfo === nameControl) {
                    return null
                } else if (_.get(channelNameInfo, 'active', '') === channelName) {
                    return channelInfo
                }
            }
        }
    }
    return null
}

export const updateChannelControls = (urlControl, globalControl, setLoadingState) => {
    getGitBranches(_.get(urlControl, 'groupControlData'), setLoadingState)

    //update existing placement rule section when user changes the namespace
    const nsControl = globalControl.find(({ id: idCtrl }) => idCtrl === 'namespace')
    const { active, availableData, groupControlData } = urlControl
    const pathData = availableData[active]

    const nameControl = groupControlData.find(({ id: idCtrlCHName }) => idCtrlCHName === 'channelName')
    const namespaceControl = groupControlData.find(({ id: idChannelNS }) => idChannelNS === 'channelNamespace')
    //use this to record if the namespace for the channel used already exists
    //this could happen when using an existing channel OR a new channel and the ns was created before but not deleted
    const namespaceControlExists = groupControlData.find(
        ({ id: idCtrlNSExists }) => idCtrlNSExists === 'channelNamespaceExists'
    )
    let existingChannel = false
    let originalChannelControl = null
    let isChannel = false
    // change channel name and namespace to reflect repository path
    if (active) {
        // if existing channel, reuse channel name and namespace
        if (pathData && pathData.metadata) {
            nameControl.active = pathData.metadata.name
            namespaceControl.active = pathData.metadata.namespace
            existingChannel = true
        } else {
            //generate a unique name for this channel
            const channelName = getUniqueChannelName(active, groupControlData)
            const channelNS = `${channelName}-ns`
            const isChannelNS = nsControl.available.includes(channelNS)

            originalChannelControl = findOriginalChannelControl(globalControl, channelName, nameControl)

            if (originalChannelControl) {
                // if existing channel, reuse channel name and namespace
                nameControl.active = channelName
                namespaceControl.active = channelNS
                namespaceControlExists.active = true
            } else if (isChannelNS) {
                nameControl.active = channelName
                for (const [key, value] of Object.entries(availableData)) {
                    if (
                        key !== undefined &&
                        value.metadata.name === channelName &&
                        value.metadata.namespace === channelNS
                    ) {
                        isChannel = true
                    }
                }
                namespaceControl.active = isChannel ? channelNS : ''
                namespaceControlExists.active = true
            } else {
                nameControl.active = channelName
                namespaceControl.active = ''
                namespaceControlExists.active =
                    _.get(nsControl, 'availableData', {})[channelNS] === undefined ? false : true
            }
        }
    } else {
        nameControl.active = ''
        namespaceControl.active = ''
        namespaceControlExists.active = false
    }

    // update reconcile rate based on selected channel url
    // if existing channel or channel already defined in app, make channel reconcile rate readonly
    // NOTE: existing channels with no reconcile rate set, will use the default medium rate
    const findReconcileRateControl = (control) => {
        return control ? control.find(({ id }) => id === 'gitReconcileRate' || id === 'helmReconcileRate') : null
    }

    const reconcileRate = findReconcileRateControl(groupControlData)
    const originalReconcileRate = findReconcileRateControl(originalChannelControl)

    let rateValue = _.get(originalReconcileRate || reconcileRate, 'active') || 'medium'
    if (pathData && pathData.raw) {
        rateValue = _.get(
            pathData.raw,
            'metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
            'medium'
        )
    }

    if (reconcileRate) {
        reconcileRate.active = rateValue
        reconcileRate.disabled = existingChannel || !!originalChannelControl
    }

    const secretName = groupControlData.find(
        ({ id }) => id === 'githubSecret' || id === 'helmSecret' || id === 'objectstoreSecret'
    )
    if (secretName) {
        const secretRef = _.get(pathData, 'spec.secretRef.name', '')
        if (existingChannel && pathData && secretRef) {
            secretName.type = 'text'
            secretName.active = secretRef
        } else {
            secretName.type = 'hidden'
            secretName.active = ''
        }
    }

    // if existing channel or using same channel, hide user/token controls, region, reconcile rate
    const showHideOrDisableControl = (cid, defaultType) => {
        const control = getControlByID(groupControlData, cid)
        control.type = existingChannel ? 'hidden' : defaultType
        if (originalChannelControl) {
            const originalControl = originalChannelControl.find((c) => c.id === cid)
            if (originalControl) {
                control.active = originalControl.active
            }
            control.disabled = true
        } else {
            control.disabled = false
        }
    }
    const { id } = urlControl
    switch (id) {
        case 'githubURL':
            showHideOrDisableControl('githubUser', 'text')
            showHideOrDisableControl('githubAccessId', 'password')
            showHideOrDisableControl('gitInsecureSkipVerify', 'checkbox')
            break
        case 'objectstoreURL':
            showHideOrDisableControl('accessKey', 'text')
            showHideOrDisableControl('secretKey', 'password')
            showHideOrDisableControl('region', 'text')
            break
        case 'helmURL':
            showHideOrDisableControl('helmUser', 'text')
            showHideOrDisableControl('helmPassword', 'password')
            showHideOrDisableControl('helmInsecureSkipVerify', 'checkbox')
            break
    }

    return globalControl
}

// when namespace changes, need to go through all placement rule sections to unset
// any control set to an existing placement rule since it might not exist in new namespace
export const updateControlsForNS = (initiatingControl, nsControl, globalControl) => {
    // for every radio group of placement selections
    const controlList = getExistingPRControlsSection(initiatingControl, globalControl)
    controlList.forEach((control) => {
        // if user selected an existing rule
        const existingRuleControl = _.get(control, 'placementrulecombo')
        const existingruleCheckbox = _.get(control, existingRuleCheckbox)
        const selectedRuleNameControl = _.get(control, 'selectedRuleName')
        if (existingruleCheckbox && existingruleCheckbox.active) {
            // unselect existing radio
            _.set(existingruleCheckbox, 'active', true)
            _.set(existingRuleControl, 'active', '')
            selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', '')
            _.set(existingRuleControl, 'opaque', false)

            // select labels instead
            const clusterSelectorControl = _.get(control, 'clusterSelector')
            _.set(clusterSelectorControl, 'active.mode', false)
            clusterSelectorControl.active.clusterLabelsListID = 1
            clusterSelectorControl.active.clusterLabelsList = [
                { id: 0, labelName: '', labelValue: '', validValue: false },
            ]
            clusterSelectorControl.showData = []
        }

        // also tell placement rule combo to load existing rules for this namespace
        const existingPlacementRuleCombo = _.get(control, 'placementrulecombo')
        existingPlacementRuleCombo && _.set(existingPlacementRuleCombo, 'isLoaded', false)
    })

    return globalControl
}

const retrieveGitDetails = async (branchName, groupControlData, setLoadingState) => {
    try {
        const gitControl = getControlByID(groupControlData, 'githubURL')
        const branchCtrl = getControlByID(groupControlData, 'githubBranch')
        const githubPathCtrl = getControlByID(groupControlData, 'githubPath')
        const githubAccessIdCtrl = getControlByID(groupControlData, 'githubAccessId')
        const githubUserCtrl = getControlByID(groupControlData, 'githubUser')

        const selectedChannel = _.get(gitControl, 'availableData', {})[_.get(gitControl, 'active', '')]
        // get git repository path from channel object if this is an existing channel, use the combo value otherwise
        const gitUrl = selectedChannel ? _.get(selectedChannel, specPathname, '') : _.get(gitControl, 'active', '')
        const namespace = _.get(selectedChannel, 'metadata.namespace', '')
        const secretRef = _.get(selectedChannel, 'secretRef', '')
        const accessToken = _.get(githubAccessIdCtrl, 'active')
        const user = _.get(githubUserCtrl, 'active')

        if (!gitUrl) {
            branchCtrl.active = ''
            branchCtrl.available = []
            return
        }

        //check only github repos
        const url = new URL(gitUrl)
        if (url.host !== 'github.com') {
            return
        }

        githubPathCtrl.active = ''
        githubPathCtrl.available = []

        if (branchName) {
            //get folders for branch
            setLoadingState(githubPathCtrl, true)
            getGitChannelPaths(gitUrl, branchName, { secretRef, namespace }, { user, accessToken }).then(
                (result) => {
                    githubPathCtrl.available = result?.sort()
                    setLoadingState(githubPathCtrl, false)
                },
                () => {
                    // on error
                    setLoadingState(githubPathCtrl, false)
                }
            )
        } else {
            //get branches
            setLoadingState(branchCtrl, true)
            const onError = () => {
                branchCtrl.exception = 'The connection to the Git repository failed. Cannot get branches.'
                setLoadingState(branchCtrl, false)
            }

            getGitChannelBranches(gitUrl, { secretRef, namespace }, { user, accessToken }).then((result) => {
                if (_.get(result, 'errors')) {
                    onError()
                } else {
                    branchCtrl.active = ''
                    branchCtrl.available = [...result]
                    branchCtrl.available.sort()
                    delete branchCtrl.exception
                    setLoadingState(branchCtrl, false)
                }
            })
        }
    } catch (err) {
        //return err
    }
}

export const updateGitBranchFolders = async (branchControl, globalControls, setLoadingState) => {
    const groupControlData = _.get(branchControl, 'groupControlData', [])
    const branchName = _.get(branchControl, 'active', '')
    retrieveGitDetails(branchName, groupControlData, setLoadingState)
}

export const getGitBranches = async (groupControlData, setLoadingState) => {
    retrieveGitDetails(null, groupControlData, setLoadingState)
}

export const setAvailableRules = (control, result) => {
    const { loading } = result
    const { data, i18n } = result
    const placementRules = data
    control.isLoading = false
    const error = placementRules ? null : result.error
    if (!control.available) {
        control.available = []
        control.availableData = []
    }
    if (error || placementRules) {
        if (error) {
            control.isFailed = true
            control.isLoaded = true
        } else if (placementRules) {
            control.isLoaded = true

            control.availableInfo = {}
            const keyFn = (rule) => {
                const ruleName = _.get(rule, 'metadata.name', '')
                const clusterSelector = _.get(rule, 'spec.clusterSelector')
                const clusterConditions = _.get(rule, 'spec.clusterConditions')
                let selector = i18n('creation.app.local.clusters.only', [ruleName])
                if (clusterSelector?.matchExpressions?.length > 0) {
                    if (clusterSelector.matchExpressions[0]?.key !== 'local-cluster') {
                        const getLabels = () => {
                            return clusterSelector.matchExpressions
                                .map(({ key, values }) => {
                                    return `${key}=${values.join(', ')}`
                                })
                                .join('; ')
                        }
                        selector = i18n('creation.app.clusters.matching', [ruleName, getLabels()])
                    }
                } else if (clusterConditions && clusterConditions[0]?.type === 'ManagedClusterConditionAvailable') {
                    selector = i18n('creation.app.clusters.all.online', [ruleName])
                } else if (clusterSelector.matchLabels) {
                    if (!clusterSelector.matchLabels['local-cluster']) {
                        selector = i18n('creation.app.clusters.matching', [ruleName, clusterSelector.matchLabels[0]])
                    }
                }
                control.availableInfo[ruleName] = selector
                return ruleName
            }
            control.availableData = _.keyBy(placementRules, keyFn)
            control.available = _.map(Object.values(control.availableData), keyFn).sort()
            control.info = ''
            const { groupControlData } = control

            // if no existing placement rules...
            const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)
            existingRuleControl.disabled = control.available.length === 0
            if (control.available.length === 0) {
                control.placeholder = i18n('creation.app.select.no.existing.placement.rule')
                const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
                clusterSelectorControl.onSelect()
            } else {
                control.placeholder = i18n('creation.app.select.existing.placement.rule')
                existingRuleControl.onSelect()
            }

            //remove default placement rule name if this is not on the list of available placements
            //in that case the name was set by the reverse function on control initialization
            if (control.active) {
                if (!control.available.includes(control.active)) {
                    control.active = null
                } else {
                    control.info = control.availableInfo[control.active]
                }
            }
        }
    } else {
        control.isLoading = loading
    }
    return control
}

export const setAvailableNSSpecs = (control, result) => {
    const { loading } = result
    const { data } = result
    control.isLoading = false
    const error = data ? null : result.error
    if (!control.available) {
        control.available = []
        control.availableMap = {}
    }
    if (control.available.length === 0 && (error || data)) {
        if (error) {
            control.isFailed = true
        } else if (data) {
            control.isLoaded = true
            control.available = data.map((d) => d.metadata.name)
            control.available.sort()
        }
    } else {
        control.isLoading = loading
    }
}

export const getExistingPRControlsSection = (initiatingControl, control) => {
    //returns the existing placement rule options for the channel selection
    const result = []

    if (_.get(initiatingControl, 'groupControlData')) {
        //the update happened on a single channel, get that channel only PRs
        const controlDataList = _.get(initiatingControl, 'groupControlData')

        const channelInfo = {}

        controlDataList.forEach((controlDataObject) => {
            channelInfo[controlDataObject.id] = controlDataObject
        })

        result.push(channelInfo)
    } else {
        //this is a global update, get all channels PRs
        const channelsControl = control.find(({ id }) => id === 'channels')

        if (channelsControl) {
            const channelsControlArr = _.get(channelsControl, 'active') || []
            channelsControlArr.forEach((channelControls) => {
                const channelInfo = {}
                channelControls.forEach((controlDataObject) => {
                    channelInfo[controlDataObject.id] = controlDataObject
                })
                result.push(channelInfo)
            })
        }
    }

    return result
}

//return channel path, to show in the combo as a user selection
export const channelSimplified = (value, control) => {
    if (!control || !value) {
        return value
    }
    const mappedData = _.get(control, 'availableData', {})[value]
    return (mappedData && _.get(mappedData, specPathname)) || value
}

export const setAvailableChannelSpecs = (type, control, result) => {
    const { loading } = result
    const { data = {} } = result
    const channels = data
    control.available = []
    control.availableMap = {}
    control.isLoading = false
    const error = channels ? null : result.error
    if (!control.available) {
        control.available = []
        control.availableMap = {}
    }
    if (control.available.length === 0 && (error || channels)) {
        if (error) {
            control.isFailed = true
        } else if (channels) {
            control.isLoaded = true
            const keyFn = (channel) => {
                return `${_.get(channel, specPathname, '')} [${_.get(channel, 'metadata.namespace', 'ns')}/${_.get(
                    channel,
                    'metadata.name',
                    'name'
                )}]`
            }
            control.availableData = _.keyBy(
                _.filter(channels, (channel) => {
                    return channel.spec.type.toLowerCase().startsWith(type)
                }),
                keyFn
            )
            control.available = _.map(Object.values(control.availableData), keyFn).sort()
        } else {
            control.isLoading = loading
        }
        return control
    }
}

export const setAvailableSecrets = (control, result) => {
    const { loading } = result
    const { data = [] } = result
    const secrets = data
    control.available = []

    control.isLoading = false
    const error = secrets ? null : result.error
    if (!control.available) {
        control.available = []
        control.availableMap = {}
        control.availableData = []
    }
    if (control.available.length === 0 && (error || secrets.length)) {
        if (error) {
            control.isFailed = true
        } else if (secrets.length) {
            control.isLoaded = true
            const ansibleCredentials = secrets.filter(
                (providerConnection) =>
                    providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                    !providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
            )
            control.available = Array.from(new Set([..._.map(ansibleCredentials, 'metadata.name')])).sort()
            return control
        }
    } else {
        control.isLoading = loading
        if (!loading) {
            control.isLoaded = true
        }
    }
}

export const getSharedPlacementRuleWarning = (control) => (
    <SharedResourceWarning resourceType={RESOURCE_TYPES.HCM_PLACEMENT_RULES} control={control} />
)

export const getSharedSubscriptionWarning = (control) => (
    <SharedResourceWarning resourceType={RESOURCE_TYPES.HCM_SUBSCRIPTIONS} control={control} />
)
