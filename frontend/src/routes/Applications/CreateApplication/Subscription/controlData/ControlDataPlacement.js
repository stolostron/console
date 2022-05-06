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

import React from 'react'
import TimeWindow, { reverse as reverseTimeWindow, summarize as summarizeTimeWindow } from '../common/TimeWindow'
import ClusterSelector, {
    reverse as reverseClusterSelector,
    summarize as summarizeClusterSelector,
} from '../common/ClusterSelector'
import {
    setAvailableRules,
    getExistingPRControlsSection,
    updateNewRuleControlsData,
    getSharedPlacementRuleWarning,
    getSharedSubscriptionWarning,
} from './utils'
import { getSourcePath } from 'temptifly'
import { listPlacementRules, NamespaceApiVersion, NamespaceKind, NamespaceDefinition } from '../../../../../resources'
import _ from 'lodash'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../../lib/rbac-util'

const existingRuleCheckbox = 'existingrule-checkbox'
const localClusterCheckbox = 'local-cluster-checkbox'
const onlineClusterCheckbox = 'online-cluster-only-checkbox'

export const loadExistingPlacementRules = () => {
    let nsControl = ''

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
export const updateNewRuleControls = (urlControl, controlGlobal) => {
    const controlList = getExistingPRControlsSection(urlControl, controlGlobal)

    const { active, availableData } = urlControl
    const selectedPR = availableData.find((pr) => pr.metadata.name === active)

    controlList.forEach((control) => {
        const selectedRuleNameControl = _.get(control, 'selectedRuleName')
        selectedRuleNameControl.active = active

        updateNewRuleControlsData(selectedPR, control)
    })
}

export const updateDisplayForPlacementControls = (urlControl, controlGlobal) => {
    //hide or show placement rule settings if user selects an existing PR
    const { active } = urlControl
    const controlList = getExistingPRControlsSection(urlControl, controlGlobal)

    controlList.forEach((control) => {
        const existingRuleControl = _.get(control, 'placementrulecombo')

        const onlineControl = _.get(control, onlineClusterCheckbox)
        const clusterSelectorControl = _.get(control, 'clusterSelector')

        const localClusterControl = _.get(control, localClusterCheckbox)

        const selectedRuleNameControl = _.get(control, 'selectedRuleName')

        if (active === true) {
            _.set(existingRuleControl, 'type', 'singleselect')

            _.set(onlineControl, 'type', 'hidden')
            _.set(clusterSelectorControl, 'type', 'hidden')
            _.set(localClusterControl, 'type', 'hidden')
        } else {
            _.set(existingRuleControl, 'type', 'hidden')
            _.set(existingRuleControl, 'active', '')
            selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', '')

            _.set(onlineControl, 'type', 'checkbox')
            _.set(onlineControl, 'disabled', false)
            _.set(clusterSelectorControl, 'type', 'custom')
            _.set(localClusterControl, 'type', 'checkbox')
        }

        //reset all values
        _.set(localClusterControl, 'active', false)
        _.set(onlineControl, 'active', false)
        if (clusterSelectorControl.active) {
            clusterSelectorControl.active.clusterLabelsListID = 1
            delete clusterSelectorControl.active.clusterLabelsList
            clusterSelectorControl.active.clusterLabelsList = [
                { id: 0, labelName: '', labelValue: '', validValue: false },
            ]
            clusterSelectorControl.active.mode = true
            delete clusterSelectorControl.showData
        }
        const availablePlacementControl = existingRuleControl.available
        if (!availablePlacementControl.includes(existingRuleControl.active)) existingRuleControl.active = ''
    })
    return controlGlobal
}

export const updatePlacementControlsForLocal = (placementControl) => {
    const { active, groupControlData } = placementControl

    const onlineControl = groupControlData.find(({ id }) => id === onlineClusterCheckbox)
    const clusterSelectorControl = groupControlData.find(({ id }) => id === 'clusterSelector')

    if (active === true) {
        if (onlineControl) {
            _.set(onlineControl, 'type', 'hidden')
            _.set(onlineControl, 'active', false)
        }
        if (clusterSelectorControl) {
            _.set(clusterSelectorControl, 'type', 'hidden')
            clusterSelectorControl.active && _.set(clusterSelectorControl.active, 'mode', false)
        }
    } else {
        if (onlineControl) {
            _.set(onlineControl, 'type', 'checkbox')
            _.set(onlineControl, 'disabled', false)
            _.set(onlineControl, 'active', false)
        }
        if (clusterSelectorControl) {
            _.set(clusterSelectorControl, 'type', 'custom')
            clusterSelectorControl.active && _.set(clusterSelectorControl.active, 'mode', true)
        }
    }

    return groupControlData
}

export const updatePlacementControlsForCustom = (placementControl) => {
    const { active, groupControlData } = placementControl

    const onlineControl = groupControlData.find(({ id }) => id === onlineClusterCheckbox)
    const localControl = groupControlData.find(({ id }) => id === localClusterCheckbox)

    localControl && _.set(localControl, 'active', false)

    if (active && active.mode) {
        onlineControl && _.set(onlineControl, 'active', false)
    } else {
        onlineControl && _.set(onlineControl, 'active', true)
    }

    return groupControlData
}

export const updatePlacementControlsForAllOnline = (placementControl) => {
    const { active, groupControlData } = placementControl

    const clusterSelectorControl = groupControlData.find(({ id }) => id === 'clusterSelector')
    const localControl = groupControlData.find(({ id }) => id === localClusterCheckbox)

    localControl && _.set(localControl, 'active', false)

    if (clusterSelectorControl && clusterSelectorControl.active) {
        if (active) {
            _.set(clusterSelectorControl.active, 'mode', false)
        } else {
            _.set(clusterSelectorControl.active, 'mode', true)
        }
    }

    return groupControlData
}

//when loading an existing app, pass to the control the placement value that is currently stored by the app
//the reverse() function retrieves this the value out of the existing app template
//the editor needs the existing value to know whether or not the user changed that value
export const reverseExistingRule = (control, templateObject) => {
    const active = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.name'))
    if (active && control.active === undefined) {
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
    const localClusterCheckboxControl = control.groupControlData.find(({ id }) => id === localClusterCheckbox)
    const onlineClusterCheckboxControl = control.groupControlData.find(({ id }) => id === onlineClusterCheckbox)
    const clusterSelectorControl = control.groupControlData.find(({ id }) => id === 'clusterSelector')

    if (_.get(localClusterCheckboxControl, 'active', false) === true) {
        summary.push(i18n('edit.app.localCluster.summary'))
    } else if (_.get(onlineClusterCheckboxControl, 'active', false) === true) {
        summary.push(i18n('edit.app.onlineClusters.summary'))
    } else if (_.get(clusterSelectorControl, 'active.mode', false) === true) {
        summary.push(i18n('edit.app.labelClusters.summary'))
    }
}

async function getClusterStatus(name) {
    let successImportStatus = false
    const localClusterNS = {
        apiVersion: NamespaceApiVersion,
        kind: NamespaceKind,
        metadata: {
            name,
        },
    }
    const authorizedNamespaces = await getAuthorizedNamespaces([rbacCreate(NamespaceDefinition)], [localClusterNS])
    const managedCluster = authorizedNamespaces.find((ns) => ns === name)
    if (managedCluster) {
        successImportStatus = true
    }
    return successImportStatus
}

const enableHubSelfManagement = getClusterStatus('local-cluster')

const placementData = async () => [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  clusters  /////////////////////////////////////
    {
        id: 'clusterSection',
        type: 'section',
        title: 'creation.app.placement.rule',
        overline: true,
        collapsable: true,
        collapsed: false,
        info: getSharedPlacementRuleWarning,
        editing: { editMode: true },
    },
    {
        id: existingRuleCheckbox,
        type: 'checkbox',
        name: 'creation.app.settings.existingRule',
        tooltip: 'tooltip.creation.app.settings.existingRule',
        onSelect: updateDisplayForPlacementControls,
        active: false,
        available: [],
        validation: {},
    },
    {
        name: 'creation.app.existingRuleCombo',
        tooltip: 'tooltip.creation.app.existingRuleCombo',
        id: 'placementrulecombo',
        type: 'hidden',
        placeholder: 'creation.app.select.existing.placement.rule',
        reverse: reverseExistingRule,
        fetchAvailable: loadExistingPlacementRules(),
        onSelect: updateNewRuleControls,
        validation: {},
    },
    {
        id: 'selectedRuleName',
        type: 'hidden',
        reverse: reverseExistingRule,
    },
    {
        type: 'custom',
        id: 'clusterSelector',
        component: <ClusterSelector />,
        available: [],
        onSelect: updatePlacementControlsForCustom,
        reverse: reverseClusterSelector,
        summarize: summarizeClusterSelector,
    },
    {
        id: onlineClusterCheckbox,
        type: 'checkbox',
        name: (await enableHubSelfManagement)
            ? 'creation.app.settings.onlineClusters'
            : 'creation.app.settings.onlineClustersOnly',
        tooltip: (await enableHubSelfManagement)
            ? 'tooltip.creation.app.settings.onlineClusters'
            : 'tooltip.creation.app.settings.onlineClustersOnly',
        active: false,
        available: [],
        onSelect: updatePlacementControlsForAllOnline,
        reverse: reverseOnline,
        summarize: summarizeOnline.bind(null),
    },
    {
        id: localClusterCheckbox,
        type: (await enableHubSelfManagement) ? 'checkbox' : 'hidden',
        name: 'creation.app.settings.localClusters',
        tooltip: 'tooltip.creation.app.settings.localClusters',
        onSelect: updatePlacementControlsForLocal,
        active: false,
        available: [],
        reverse: [
            'Subscription[0].spec.placement.local',
            'PlacementRule[0].spec.clusterSelector.matchLabels.local-cluster',
        ],
        summarize: (control, controlData, summary, i18n) => {
            if (control.active) {
                summary.push(i18n('edit.app.localCluster.summary'))
            }
        },
    },
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  settings  /////////////////////////////////////
    {
        id: 'settingsSection',
        type: 'section',
        title: 'creation.app.section.settings',
        overline: true,
        collapsable: true,
        collapsed: false,
        info: getSharedSubscriptionWarning,
        editing: { editMode: true },
    },
    {
        type: 'custom',
        name: 'creation.app.settings.timeWindow',
        tooltip: 'creation.app.settings.timeWindow.tooltip',
        id: 'timeWindow',
        component: <TimeWindow />,
        available: [],
        reverse: reverseTimeWindow,
        summarize: summarizeTimeWindow,
    },
]

export default placementData
