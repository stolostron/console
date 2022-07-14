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

import { VALIDATE_URL } from '../../../../../components/TemplateEditor'
import { loadExistingChannels, updateChannelControls, channelSimplified } from './utils'
import placementData from './ControlDataPlacement'

const objectstoreChannelData = (isLocalCluster) => [
    ///////////////////////  Objectstore  /////////////////////////////////////
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
        name: 'creation.app.objectstore.url',
        tooltip: 'tooltip.creation.app.objectstore.url',
        id: 'objectstoreURL',
        type: 'combobox',
        active: '',
        placeholder: 'app.enter.select.objectstore.url',
        available: [],
        validation: VALIDATE_URL,
        fetchAvailable: loadExistingChannels('objectbucket'),
        reverse: 'Channel[0].spec.pathname',
        onSelect: updateChannelControls,
        simplified: channelSimplified,
    },
    {
        name: 'creation.app.objectstore.secret',
        tooltip: 'tooltip.creation.app.objectstore.secret',
        id: 'objectstoreSecret',
        type: 'hidden',
        active: '',
        available: [],
        disabled: true,
    },
    {
        name: 'creation.app.objectstore.accesskey',
        tooltip: 'tooltip.creation.app.objectstore.accesskey',
        id: 'accessKey',
        type: 'text',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        active: '',
        encode: true,
        placeholder: 'app.enter.accesskey',
    },
    {
        name: 'creation.app.objectstore.secretkey',
        tooltip: 'tooltip.creation.app.objectstore.secretkey',
        id: 'secretKey',
        type: 'password',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        encode: true,
        active: '',
        placeholder: 'app.enter.secretkey',
    },
    {
        name: 'creation.app.objectstore.region',
        tooltip: 'tooltip.creation.app.objectstore.region',
        id: 'region',
        type: 'text',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        encode: true,
        active: '',
        placeholder: 'app.enter.region',
    },
    {
        name: 'creation.app.objectstore.subfolder',
        tooltip: 'tooltip.creation.app.objectstore.subfolder',
        id: 'subfolder',
        type: 'text',
        active: '',
        placeholder: 'app.enter.subfolder',
        reverse: ['Subscription[0].metadata.annotations["apps.open-cluster-management.io/bucket-path"]'],
    },

    ...placementData(isLocalCluster),
]

export default objectstoreChannelData
