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

// seems to be an issue with this rule and redux

import TimeWindow, { reverse as reverseTimeWindow, summarize as summarizeTimeWindow } from '../common/TimeWindow'
import ClusterSelector, { summarize as summarizeClusterSelector } from '../common/ClusterSelector'
import { getSharedPlacementRuleWarning, getSharedSubscriptionWarning } from './utils'
import { getSourcePath } from '../../../../../components/TemplateEditor'
import { listPlacementRules } from '../../../../../resources'
import { getControlByID } from '../../../../../lib/temptifly-utils'
import _ from 'lodash'

const clusterSelectorCheckbox = 'clusterSelector'
const existingRuleCheckbox = 'existingrule-checkbox'
const localClusterCheckbox = 'local-cluster-checkbox'
const onlineClusterCheckbox = 'online-cluster-only-checkbox'
const unavailable = '-unavailable-'

export const loadExistingPlacementRules = () => {
    let nsControl = undefined

    return {
        query: () => {
            return listPlacementRules(nsControl.active).promise
        },
        variables: (control, globalControl) => {
            nsControl = globalControl.find(({ id: idCtrl }) => idCtrl === 'namespace')
        },
        loadingDesc: 'creation.app.loading.rules',
        setAvailable: setAvailableRules.bind(null),
    }
}

const setAvailableRules = (control, result) => {
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
            const { groupControlData } = control
            const enableHubSelfManagement = getControlByID(groupControlData, 'enableHubSelfManagement')

            const keyFn = (rule) => {
                const ruleName = _.get(rule, 'metadata.name', '')
                const clusterSelector = _.get(rule, 'spec.clusterSelector')
                const clusterConditions = _.get(rule, 'spec.clusterConditions')
                let selector = enableHubSelfManagement?.active
                    ? i18n('creation.app.local.clusters.only', [ruleName])
                    : unavailable
                if (clusterSelector?.matchExpressions?.length > 0) {
                    if (clusterSelector.matchExpressions[0]?.key !== 'local-cluster') {
                        const getLabels = () => {
                            return clusterSelector.matchExpressions
                                .map(({ key, operator, values }) => {
                                    return `${key} "${operator}" ${values.join(', ')}`
                                })
                                .join('; ')
                        }
                        selector = i18n('creation.app.clusters.expressions', [ruleName, getLabels()])
                    }
                } else if (clusterConditions && clusterConditions[0]?.type === 'ManagedClusterConditionAvailable') {
                    selector = enableHubSelfManagement?.active
                        ? i18n('creation.app.clusters.all.online', [ruleName])
                        : i18n('creation.app.clusters.only.online', [ruleName])
                } else if (clusterSelector.matchLabels) {
                    if (!clusterSelector.matchLabels['local-cluster']) {
                        const getLabels = () => {
                            return Object.entries(clusterSelector.matchLabels)
                                .map(([key, value]) => {
                                    return `${key}=${value}`
                                })
                                .join('; ')
                        }
                        selector = i18n('creation.app.clusters.matching', [ruleName, getLabels()])
                    }
                }
                control.availableInfo[ruleName] = selector
                return ruleName
            }
            control.availableData = _.keyBy(placementRules, keyFn)
            control.available = _.map(Object.values(control.availableData), keyFn)
                .filter((ruleName) => control.availableInfo[ruleName] !== unavailable)
                .sort()
            control.info = ''

            // if no existing placement rules...
            const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)
            existingRuleControl.disabled = control.available.length === 0
            if (control.available.length === 0) {
                control.placeholder = i18n('creation.app.select.no.existing.placement.rule')
                const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
                clusterSelectorControl.onSelect()
            } else {
                control.placeholder = i18n('creation.app.settings.existingRule')
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

export const updatePlacementControls = (control) => {
    const { id, groupControlData } = control

    // get radio controls

    const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
    const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)
    const onlineControl = getControlByID(groupControlData, onlineClusterCheckbox)
    const localClusterControl = getControlByID(groupControlData, localClusterCheckbox)

    // set radio buttons based on what was selected
    clusterSelectorControl && _.set(clusterSelectorControl, 'active.mode', id === clusterSelectorCheckbox)
    existingRuleControl && _.set(existingRuleControl, 'active', id === existingRuleCheckbox)
    onlineControl && _.set(onlineControl, 'active', id === onlineClusterCheckbox)
    localClusterControl && _.set(localClusterControl, 'active', id === localClusterCheckbox)

    // opaque the existing rules combobox
    const selectedRuleComboControl = groupControlData.find(({ id }) => id === 'placementrulecombo')
    _.set(selectedRuleComboControl, 'opaque', id !== existingRuleCheckbox) // && !existingRuleControl.disabled)
    if (id !== existingRuleCheckbox) {
        selectedRuleComboControl.active = ''
        selectedRuleComboControl.info = ''
        const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
        selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', '')
    }

    return groupControlData
}

// existing placement rule combo box changed -- update hidden value used in temptlate
export const updateNewRuleControls = (control) => {
    const { availableData, availableInfo, groupControlData } = control
    const active = availableData[control.active]
    control.info = availableInfo ? availableInfo[control?.active] : ''
    const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
    selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', _.get(active, 'metadata.name'))
}

/////////////////////////////////////////////////////////////////////////////
/////////////// when editing, reverse yaml source into these controls /////////////////
/////////////////////////////////////////////////////////////////////////////

//when loading an existing app, pass to the control the placement value that is currently stored by the app
//the reverse() function retrieves this the value out of the existing app template
//the editor needs the existing value to know whether or not the user changed that value
export const reverseExistingRule = (control, templateObject) => {
    const { groupControlData } = control
    const existingRuleControl = groupControlData.find(({ id }) => id === existingRuleCheckbox)
    const active = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.name'))
    if (existingRuleControl.active && active && control.active === undefined) {
        control.active = active.$v
    }
    return control
}

export const reverseOnline = (control, templateObject) => {
    const active = _.get(templateObject, getSourcePath('PlacementRule[0].spec.clusterConditions[0].type'))
    if (active) {
        control.active = !_.isEmpty(active)
    }
}

export const summarizeOnline = (control, globalControlData, summary, i18n) => {
    const localClusterCheckboxControl = getControlByID(control.groupControlData, localClusterCheckbox)
    const onlineClusterCheckboxControl = getControlByID(control.groupControlData, onlineClusterCheckbox)
    const clusterSelectorControl = getControlByID(control.groupControlData, clusterSelectorCheckbox)
    const existingRuleControl = getControlByID(control.groupControlData, existingRuleCheckbox)
    const existingRuleCombo = getControlByID(control.groupControlData, 'placementrulecombo')

    if (_.get(existingRuleControl, 'active', false) === true) {
        summary.push(existingRuleCombo.info)
    } else if (_.get(localClusterCheckboxControl, 'active', false) === true) {
        summary.push(i18n('edit.app.localCluster.summary'))
    } else if (_.get(onlineClusterCheckboxControl, 'active', false) === true) {
        summary.push(i18n('edit.app.onlineClusters.summary'))
    } else if (_.get(clusterSelectorControl, 'active.mode', false) === true) {
        summarizeClusterSelector(control, [], summary)
    }
}

export const summarizeSelectorControl = (control, globalControlData, summary) => {
    const clusterSelectorControl = getControlByID(control.groupControlData, clusterSelectorCheckbox)

    if (_.get(clusterSelectorControl, 'active.mode', false) === true) {
        summarizeClusterSelector(control, [], summary)
    }
}

const placementData = (isLocalCluster) => [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  clusters  /////////////////////////////////////
    {
        id: 'clusterSection',
        type: 'section',
        title: 'creation.app.placement.rule',
        subgroup: true,
        collapsable: true,
        collapsed: false,
        info: getSharedPlacementRuleWarning,
        editing: { editMode: true },
    },
    {
        id: existingRuleCheckbox,
        type: 'radio',
        name: 'creation.app.settings.existingRule',
        tooltip: 'tooltip.creation.app.settings.existingRule',
        onSelect: updatePlacementControls,
        active: true,
        summarize: summarizeOnline,
    },
    {
        id: 'placementrulecombo',
        type: 'combobox',
        opaque: false,
        placeholder: 'creation.app.settings.existingRule',
        reverse: reverseExistingRule,
        fetchAvailable: loadExistingPlacementRules(),
        onSelect: updateNewRuleControls,
        validation: {},
        summarize: () => {},
    },
    {
        id: 'selectedRuleName',
        type: 'hidden',
        reverse: reverseExistingRule,
    },
    {
        id: 'enableHubSelfManagement',
        type: 'hidden',
        active: isLocalCluster,
    },
    {
        type: 'custom',
        id: 'clusterSelector',
        component: <ClusterSelector />,
        available: [],
        onSelect: updatePlacementControls,
        summarize: summarizeSelectorControl,
    },
    {
        id: onlineClusterCheckbox,
        type: 'radio',
        name: isLocalCluster ? 'creation.app.settings.onlineClusters' : 'creation.app.settings.onlineClustersOnly',
        tooltip: isLocalCluster
            ? 'tooltip.creation.app.settings.onlineClusters'
            : 'tooltip.creation.app.settings.onlineClustersOnly',
        active: false,
        available: [],
        onSelect: updatePlacementControls,
        reverse: reverseOnline,
        summarize: () => {},
    },
    {
        id: localClusterCheckbox,
        type: isLocalCluster ? 'radio' : 'hidden',
        name: 'creation.app.settings.localClusters',
        tooltip: 'tooltip.creation.app.settings.localClusters',
        onSelect: updatePlacementControls,
        active: false,
        available: [],
        reverse: [
            'Subscription[0].spec.placement.local',
            'PlacementRule[0].spec.clusterSelector.matchLabels.local-cluster',
        ],
        summarize: () => {},
    },
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  settings  /////////////////////////////////////
    {
        id: 'settingsSection',
        type: 'section',
        title: 'creation.app.section.settings',
        subgroup: true,
        collapsable: true,
        collapsed: false,
        info: getSharedSubscriptionWarning,
        editing: { editMode: true },
    },
    {
        type: 'custom',
        id: 'timeWindow',
        component: <TimeWindow />,
        available: [],
        reverse: reverseTimeWindow,
        summarize: summarizeTimeWindow,
    },
]

export default placementData
