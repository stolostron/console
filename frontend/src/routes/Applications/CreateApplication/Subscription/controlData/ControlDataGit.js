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

import { VALID_REPOPATH, VALIDATE_URL, getSourcePath } from '../../../../../components/TemplateEditor'
import placementData from './ControlDataPlacement'
import prePostTasks from './ControlDataPrePostTasks'
import {
    getGitBranches,
    loadExistingChannels,
    updateChannelControls,
    updateGitBranchFolders,
    channelSimplified,
} from './utils'
import { getControlByID } from '../../../../../lib/temptifly-utils'
import _ from 'lodash'

export const validateBranch = (branch) => {
    // Validate branch name according to rules from https://git-scm.com/docs/git-check-ref-format
    // Rule 2 and exceptions do not apply

    const negativeExpressions = [
        // (3) They cannot have two consecutive dots .. anywhere
        /\.\./,
        //  (4) They cannot have ASCII control characters (i.e. bytes whose values are lower than \040, or \177 DEL),
        //      space, tilde ~, caret ^, or colon : anywhere
        //  (5) They cannot have question-mark ?, asterisk *, or open bracket [ anywhere
        // (10) They cannot contain a \
        /[\000-\037\177 ~^:?*[\\]/,
        // (6) They cannot begin or end with a slash / or contain multiple consecutive slashes
        /^\//,
        /\/$/,
        /\/\//,
        // (7) They cannot end with a dot .
        /\.$/,
        // (8) They cannot contain a sequence @{
        /@\{/,
    ]

    if (negativeExpressions.some((ne) => ne.test(branch))) {
        // at least one rule is broken
        return false
    }

    // (9) They cannot be the single character @
    if (branch === '@') {
        return false
    }

    // (1) They can include slash / for hierarchical (directory) grouping, but no slash-separated component
    // can begin with a dot . or end with the sequence .lock
    const components = branch.split('/')
    if (components.length > 0 && components.some((c) => c.startsWith('.') || c.endsWith('.lock'))) {
        return false
    }

    return true
}

export const VALIDATE_GITBRANCH = {
    tester: {
        test: validateBranch,
    },
    notification: 'creation.valid.gitbranch',
    required: false,
}

export const updateGitCredentials = (urlControl, globalControl, setLoadingState) => {
    const groupControlData = _.get(urlControl, 'groupControlData')

    const userCtrlData = _.get(getControlByID(groupControlData, 'githubUser'), 'active', '')

    const tokenCtrlData = _.get(getControlByID(groupControlData, 'githubAccessId'), 'active', '')

    if (
        (userCtrlData.length > 0 && tokenCtrlData.length > 0) ||
        (userCtrlData.length === 0 && tokenCtrlData.length === 0)
    ) {
        getGitBranches(_.get(urlControl, 'groupControlData'), setLoadingState)
    }
    return groupControlData
}

export const updateSubReconcileRate = (subReconcileRateControl) => {
    const groupControlData = _.get(subReconcileRateControl, 'groupControlData')

    const gitReconcileOption = getControlByID(groupControlData, 'gitReconcileOption')

    if (subReconcileRateControl.active) {
        gitReconcileOption.type = 'hidden'
        gitReconcileOption.active = ''
    } else {
        gitReconcileOption.type = 'combobox'
        gitReconcileOption.active = 'merge'
    }
}

export const reverseSubReconcileRate = (control, templateObject) => {
    const active = _.get(
        templateObject,
        getSourcePath('Subscription[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]')
    )
    if (active) {
        control.active = true

        const { groupControlData } = control
        const gitReconcileOption = getControlByID(groupControlData, 'gitReconcileOption')
        gitReconcileOption.type = 'hidden'
        gitReconcileOption.active = ''
    }
    return control
}

const githubChannelData = (isLocalCluster) => [
    ///////////////////////  github  /////////////////////////////////////
    {
        id: 'channelNamespaceExists',
        type: 'hidden',
        active: true,
    },
    {
        id: 'channelName',
        type: 'hidden',
        active: '',
    },
    {
        id: 'channelNamespace',
        type: 'hidden',
        active: '',
    },
    {
        name: 'creation.app.github.url',
        tooltip: 'tooltip.creation.app.github.url',
        id: 'githubURL',
        type: 'combobox',
        active: '',
        placeholder: 'app.enter.select.github.url',
        available: [],
        validation: VALIDATE_URL,
        fetchAvailable: loadExistingChannels('git'),
        reverse: 'Channel[0].spec.pathname',
        onSelect: updateChannelControls,
        simplified: channelSimplified,
    },
    {
        name: 'creation.app.github.secret',
        tooltip: 'tooltip.creation.app.github.secret',
        id: 'githubSecret',
        type: 'hidden',
        active: '',
        available: [],
        disabled: true,
    },
    {
        name: 'creation.app.github.user',
        tooltip: 'tooltip.creation.app.github.user',
        id: 'githubUser',
        type: 'text',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        active: '',
        encode: true,
        placeholder: 'app.enter.select.username',
        onSelect: updateGitCredentials,
    },
    {
        name: 'creation.app.github.accessid',
        tooltip: 'tooltip.creation.app.github.accessid',
        id: 'githubAccessId',
        type: 'password',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        encode: true,
        active: '',
        placeholder: 'app.enter.access.token',
        onSelect: updateGitCredentials,
    },
    {
        name: 'creation.app.github.branch',
        tooltip: 'tooltip.creation.app.github.branch',
        id: 'githubBranch',
        type: 'combobox',
        active: '',
        placeholder: 'app.enter.select.branch',
        available: [],
        validation: VALIDATE_GITBRANCH,
        reverse: [
            'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-branch"]',
            'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-branch"]',
        ],
        onSelect: updateGitBranchFolders,
        cacheUserValueKey: 'create.app.github.branch',
    },
    {
        name: 'creation.app.github.path',
        tooltip: 'tooltip.creation.app.github.path',
        id: 'githubPath',
        type: 'combobox',
        active: '',
        placeholder: 'app.enter.select.path',
        available: [],
        validation: VALID_REPOPATH,
        reverse: [
            'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-path"]',
            'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-path"]',
        ],
        cacheUserValueKey: 'create.app.github.path',
    },
    {
        id: 'gitDesiredCommit',
        type: 'text',
        name: 'creation.app.github.desiredCommit',
        tooltip: 'tooltip.creation.app.github.desiredCommit',
        placeholder: 'app.enter.select.desiredCommit',
        reverse: 'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-desired-commit"]',
    },
    {
        id: 'gitTag',
        type: 'text',
        name: 'creation.app.github.tag',
        tooltip: 'tooltip.creation.app.github.tag',
        placeholder: 'app.enter.select.tag',
        reverse: 'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-tag"]',
    },
    {
        id: 'gitReconcileOption',
        type: 'combobox',
        name: 'creation.app.github.reconcileOption',
        tooltip: 'tooltip.creation.app.github.reconcileOption',
        active: 'merge',
        available: ['merge', 'replace'],
        reverse: 'Subscription[0].metadata.annotations["apps.open-cluster-management.io/reconcile-option"]',
    },
    {
        id: 'gitReconcileRate',
        type: 'combobox',
        editing: { disabled: true }, // if editing existing app, disable this field
        name: 'creation.app.reconcileRate',
        tooltip: 'tooltip.creation.app.reconcileRate',
        active: 'medium',
        available: ['low', 'medium', 'high', 'off'],
        reverse: 'Channel[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
    },
    {
        id: 'gitSubReconcileRate',
        type: 'checkbox',
        name: 'creation.app.subReconcileRate',
        tooltip: 'tooltip.creation.app.subReconcileRate',
        active: false,
        available: [],
        onSelect: updateSubReconcileRate,
        reverse: reverseSubReconcileRate,
    },
    {
        id: 'gitInsecureSkipVerify',
        type: 'checkbox',
        name: 'creation.app.insecureSkipVerify.label',
        tooltip: 'creation.app.insecureSkipVerify.git.tooltip',
        active: false,
        available: [],
        editing: { hidden: true }, // if editing existing app, hide this field initially
    },

    ...prePostTasks,

    ...placementData(isLocalCluster),
]

export default githubChannelData
