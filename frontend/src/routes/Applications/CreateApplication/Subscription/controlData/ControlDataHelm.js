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

const helmReleaseChannelData = (isLocalCluster) => [
    ///////////////////////  HelmRelease  /////////////////////////////////////
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
        fetchAvailable: loadExistingChannels('helmrepo'),
        reverse: 'Channel[0].spec.pathname',
        onSelect: updateChannelControls,
        simplified: channelSimplified,
    },
    {
        name: 'creation.app.helmrepo.secret',
        tooltip: 'tooltip.creation.app.helmrepo.secret',
        id: 'helmSecret',
        type: 'hidden',
        active: '',
        available: [],
        disabled: true,
    },
    {
        name: 'creation.app.helmrepo.user',
        tooltip: 'tooltip.creation.app.helmrepo.user',
        id: 'helmUser',
        type: 'text',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        active: '',
        encode: true,
        placeholder: 'app.enter.helmrepo.username',
    },
    {
        name: 'creation.app.helmrepo.password',
        tooltip: 'tooltip.creation.app.helmrepo.password',
        id: 'helmPassword',
        type: 'password',
        editing: { hidden: true }, // if editing existing app, hide this field initially
        encode: true,
        active: '',
        placeholder: 'app.enter.helmrepo.password',
    },
    {
        name: 'creation.app.helmrepo.chart.name',
        tooltip: 'tooltip.creation.app.helmrepo.chart.name',
        id: 'helmChartName',
        type: 'text',
        syncWith: 'helmPackageAlias',
        active: '',
        placeholder: 'app.enter.helmrepo.chart.name',
        validation: {
            required: true,
        },
        reverse: 'Subscription[0].spec.name',
    },
    {
        name: 'creation.app.helmrepo.package.alias',
        tooltip: 'tooltip.creation.app.helmrepo.package.alias',
        id: 'helmPackageAlias',
        type: 'text',
        syncedWith: 'helmChartName',
        active: '',
        placeholder: 'app.enter.helmrepo.package.alias',
        validation: {
            required: true,
        },
        reverse: 'Subscription[0].spec.packageOverrides[0].packageAlias',
    },
    {
        name: 'creation.app.helmrepo.package.version',
        tooltip: 'tooltip.creation.app.helmrepo.package.version',
        id: 'helmPackageVersion',
        type: 'text',
        active: '',
        placeholder: 'app.enter.helmrepo.package.version',
        reverse: 'Subscription[0].spec.packageFilter.version',
    },
    {
        id: 'helmReconcileRate',
        type: 'combobox',
        editing: { disabled: true }, // if editing existing app, disable this field
        name: 'creation.app.reconcileRate',
        tooltip: 'tooltip.creation.app.reconcileRate',
        active: 'medium',
        available: ['low', 'medium', 'high', 'off'],
        reverse: 'Channel[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
    },
    {
        id: 'helmSubReconcileRate',
        type: 'checkbox',
        name: 'creation.app.subReconcileRate',
        tooltip: 'tooltip.creation.app.subReconcileRate',
        active: false,
        available: [],
        reverse: 'Subscription[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
    },
    {
        id: 'helmInsecureSkipVerify',
        type: 'checkbox',
        name: 'creation.app.insecureSkipVerify.label',
        tooltip: 'creation.app.insecureSkipVerify.helm.tooltip',
        active: false,
        available: [],
        editing: { hidden: true }, // if editing existing app, hide this field initially
    },

    ...placementData(isLocalCluster),
]

export default helmReleaseChannelData
