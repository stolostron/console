/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { VALIDATE_URL } from 'temptifly'
import {
    // loadExistingChannels,
    channelSimplified,
    // updateSyncPolicies
} from './utils'

export const helmChannelData = [
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
        name: 'creation.app.helmrepo.url',
        tooltip: 'tooltip.creation.app.helmrepo.url',
        id: 'helmURL',
        type: 'combobox',
        active: '',
        placeholder: 'app.enter.select.helmrepo.url',
        available: [],
        validation: VALIDATE_URL,
        // fetchAvailable: loadExistingChannels('helmrepo'),
        reverse: 'ApplicationSet[0].spec.template.spec.source.repoURL',
        // onSelect: updateSyncPolicies,
        simplified: channelSimplified,
    },
    {
        name: 'creation.app.helmrepo.chart.name',
        tooltip: 'tooltip.creation.app.helmrepo.chart.name',
        id: 'helmChartName',
        type: 'text',
        active: '',
        placeholder: 'app.enter.helmrepo.chart.name',
        validation: {
            required: true,
        },
        reverse: 'ApplicationSet[0].spec.template.spec.source.chart',
    },
    {
        name: 'creation.app.helmrepo.package.version',
        tooltip: 'tooltip.creation.app.helmrepo.package.version',
        id: 'helmPackageVersion',
        type: 'text',
        active: '',
        placeholder: 'app.enter.helmrepo.package.version',
        validation: {
            required: true,
        },
        reverse: 'ApplicationSet[0].spec.template.spec.source.targetRevision',
    },
]

export default helmChannelData
