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
import { setAvailableRules, getSharedPlacementRuleWarning, getSharedSubscriptionWarning } from './utils'
import { getSourcePath } from 'temptifly'
import { listPlacementRules, NamespaceApiVersion, NamespaceKind, NamespaceDefinition } from '../../../../../resources'
import _ from 'lodash'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../../lib/rbac-util'

const clusterSelectorCheckbox = 'clusterSelector'
const existingRuleCheckbox = 'existingrule-checkbox'
const localClusterCheckbox = 'local-cluster-checkbox'
const onlineClusterCheckbox = 'online-cluster-only-checkbox'

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

export const updatePlacementControls = (control) => {
    const { id, groupControlData } = control

    // get radio controls
    const clusterSelectorControl = groupControlData.find(({ id }) => id === clusterSelectorCheckbox)
    const existingRuleControl = groupControlData.find(({ id }) => id === existingRuleCheckbox)
    const onlineControl = groupControlData.find(({ id }) => id === onlineClusterCheckbox)
    const localClusterControl = groupControlData.find(({ id }) => id === localClusterCheckbox)

    // set radio buttons based on what was selected
    clusterSelectorControl && _.set(clusterSelectorControl, 'active.mode', id === clusterSelectorCheckbox)
    existingRuleControl && _.set(existingRuleControl, 'active', id === existingRuleCheckbox)
    onlineControl && _.set(onlineControl, 'active', id === onlineClusterCheckbox)
    localClusterControl && _.set(localClusterControl, 'active', id === localClusterCheckbox)

    // opaque the existing rules combobox
    const selectedRuleComboControl = groupControlData.find(({ id }) => id === 'placementrulecombo')
    _.set(selectedRuleComboControl, 'opaque', id !== existingRuleCheckbox)
    if (id !== existingRuleCheckbox) {
        selectedRuleComboControl.active = ''
        const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
        selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', '')
    }

    return groupControlData
}

// existing placement rule combo box changed -- update hidden value used in temptlate
export const updateNewRuleControls = (control) => {
    const { active, groupControlData } = control
    const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
    selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', active)
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

/////////////////////////////////////////////////////////////////////////////
/////////////// summarize when section closed /////////////////
/////////////////////////////////////////////////////////////////////////////
export const summarizeOnline = (control, globalControlData, summary, i18n) => {
    const localClusterCheckboxControl = control.groupControlData.find(({ id }) => id === localClusterCheckbox)
    const onlineClusterCheckboxControl = control.groupControlData.find(({ id }) => id === onlineClusterCheckbox)
    const clusterSelectorControl = control.groupControlData.find(({ id }) => id === clusterSelectorCheckbox)

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
        type: 'custom',
        id: clusterSelectorCheckbox,
        component: <ClusterSelector />,
        available: [],
        onSelect: updatePlacementControls,
        reverse: reverseClusterSelector,
        summarize: summarizeClusterSelector,
    },
    {
        id: existingRuleCheckbox,
        type: 'radio',
        name: 'creation.app.settings.existingRule',
        tooltip: 'tooltip.creation.app.settings.existingRule',
        onSelect: updatePlacementControls,
        active: false,
        available: [],
        validation: {},
    },
    {
        id: 'placementrulecombo',
        type: 'singleselect',
        opaque: true,
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
        id: onlineClusterCheckbox,
        type: 'radio',
        name: (await enableHubSelfManagement)
            ? 'creation.app.settings.onlineClusters'
            : 'creation.app.settings.onlineClustersOnly',
        tooltip: (await enableHubSelfManagement)
            ? 'tooltip.creation.app.settings.onlineClusters'
            : 'tooltip.creation.app.settings.onlineClustersOnly',
        active: false,
        available: [],
        onSelect: updatePlacementControls,
        reverse: reverseOnline,
        summarize: summarizeOnline.bind(null),
    },
    {
        id: localClusterCheckbox,
        type: (await enableHubSelfManagement) ? 'radio' : 'hidden',
        name: 'creation.app.settings.localClusters',
        tooltip: 'tooltip.creation.app.settings.localClusters',
        onSelect: updatePlacementControls,
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
        id: 'timeWindow',
        component: <TimeWindow />,
        available: [],
        reverse: reverseTimeWindow,
        summarize: summarizeTimeWindow,
    },
]

export default placementData
