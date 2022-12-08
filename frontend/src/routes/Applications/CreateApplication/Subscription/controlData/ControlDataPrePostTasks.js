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

import { getSharedSubscriptionWarning } from './utils'
import { CreateCredentialModal } from '../../../../../components/CreateCredentialModal'
import { insertToggleModalFunction } from '../../../../Infrastructure/Clusters/ManagedClusters/CreateCluster/controlData/ControlDataHelpers'

const getControlDataPrePostTasks = (handleModalToggle, t) => {
    const controlData = prePostTasks(t)
    insertToggleModalFunction(handleModalToggle, controlData)
    return controlData
}

const prePostTasks = (t) => {
    return [
        ////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////  pre/post jobs  /////////////////////////////////////
        {
            id: 'perPostSection',
            type: 'section',
            title: t('creation.app.section.prePost'),
            subgroup: true,
            collapsable: true,
            collapsed: true,
            info: getSharedSubscriptionWarning,
            editing: { collapsed: true, editMode: true }, // if editing existing app, collapse this field initially
        },
        {
            name: t('creation.app.ansible.credential.name'),
            tooltip: t('tooltip.creation.app.ansibleSecretName'),
            id: 'connection',
            type: 'singleselect',
            providerId: 'ans',
            active: '',
            placeholder: t('app.enter.select.ansibleSecretName'),
            available: [],
            reverse: 'Subscription[0].spec.hooksecretref.name',
            validation: {},
            footer: <CreateCredentialModal />,
        },
    ]
}

export default getControlDataPrePostTasks
