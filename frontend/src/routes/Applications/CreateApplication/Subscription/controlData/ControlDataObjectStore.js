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

import { getURLValidator } from '../../../../../components/TemplateEditor'
import { updateChannelControls, channelSimplified } from './utils'
import placementData from './ControlDataPlacement'

const objectstoreChannelData = (isLocalCluster, t) => {
    return [
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
            name: t('creation.app.objectstore.url'),
            tooltip: t('tooltip.creation.app.objectstore.url'),
            id: 'objectstoreURL',
            type: 'combobox',
            active: '',
            placeholder: t('app.enter.select.objectstore.url'),
            available: [],
            validation: getURLValidator(t),
            reverse: 'Channel[0].spec.pathname',
            onSelect: updateChannelControls,
            simplified: channelSimplified,
        },
        {
            name: t('creation.app.objectstore.secret'),
            tooltip: t('tooltip.creation.app.objectstore.secret'),
            id: 'objectstoreSecret',
            type: 'hidden',
            active: '',
            available: [],
            disabled: true,
        },
        {
            name: t('creation.app.objectstore.accesskey'),
            tooltip: t('tooltip.creation.app.objectstore.accesskey'),
            id: 'accessKey',
            type: 'text',
            editing: { hidden: true }, // if editing existing app, hide this field initially
            active: '',
            encode: true,
            placeholder: t('app.enter.accesskey'),
        },
        {
            name: t('creation.app.objectstore.secretkey'),
            tooltip: t('tooltip.creation.app.objectstore.secretkey'),
            id: 'secretKey',
            type: 'password',
            editing: { hidden: true }, // if editing existing app, hide this field initially
            encode: true,
            active: '',
            placeholder: t('app.enter.secretkey'),
        },
        {
            name: t('creation.app.objectstore.region'),
            tooltip: t('tooltip.creation.app.objectstore.region'),
            id: 'region',
            type: 'text',
            editing: { hidden: true }, // if editing existing app, hide this field initially
            encode: true,
            active: '',
            placeholder: t('app.enter.region'),
        },
        {
            name: t('creation.app.objectstore.subfolder'),
            tooltip: t('tooltip.creation.app.objectstore.subfolder'),
            id: 'subfolder',
            type: 'text',
            active: '',
            placeholder: t('app.enter.subfolder'),
            reverse: ['Subscription[0].metadata.annotations["apps.open-cluster-management.io/bucket-path"]'],
        },

        ...placementData(isLocalCluster, t),
    ]
}

export default objectstoreChannelData
