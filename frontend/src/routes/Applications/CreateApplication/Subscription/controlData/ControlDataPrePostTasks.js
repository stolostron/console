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

import { loadExistingAnsibleProviders, getSharedSubscriptionWarning } from './utils'
import React from 'react'
import { AcmIcon, AcmIconVariant } from '../../../../../ui-components'

const prePostTasks = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  pre/post jobs  /////////////////////////////////////
    {
        id: 'perPostSection',
        type: 'section',
        title: 'creation.app.section.prePost',
        overline: true,
        collapsable: true,
        collapsed: true,
        info: getSharedSubscriptionWarning,
        editing: { collapsed: true, editMode: true }, // if editing existing app, collapse this field initially
    },
    {
        name: 'creation.app.ansible.credential.name',
        tooltip: 'tooltip.creation.app.ansibleSecretName',
        id: 'ansibleSecretName',
        type: 'singleselect',
        active: '',
        placeholder: 'app.enter.select.ansibleSecretName',
        available: [],
        fetchAvailable: loadExistingAnsibleProviders(),
        reverse: 'Subscription[0].spec.hooksecretref.name',
        validation: {},
        prompts: {
            prompt: 'creation.ocp.cloud.add.connection',
            icon: <AcmIcon icon={AcmIconVariant.openNewTab} />,
            type: 'link',
            url: '/multicloud/credentials/add', // launch to credential page
            positionBottomRight: true,
            id: 'add-provider-connection',
        },
    },
]

export default prePostTasks
