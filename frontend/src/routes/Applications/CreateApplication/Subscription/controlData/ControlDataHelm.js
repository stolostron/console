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

const helmReleaseChannelData = (isLocalCluster, t) => {
    return [
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
            name: t('creation.app.helmrepo.url'),
            tooltip: t('tooltip.creation.app.helmrepo.url'),
            id: 'helmURL',
            type: 'combobox',
            active: '',
            placeholder: t('app.enter.select.helmrepo.url'),
            available: [],
            validation: getURLValidator(t),
            reverse: 'Channel[0].spec.pathname',
            onSelect: updateChannelControls,
            simplified: channelSimplified,
        },
        {
            name: t('creation.app.helmrepo.secret'),
            tooltip: t('tooltip.creation.app.helmrepo.secret'),
            id: 'helmSecret',
            type: 'hidden',
            active: '',
            available: [],
            disabled: true,
        },
        {
            name: t('creation.app.helmrepo.user'),
            tooltip: t('tooltip.creation.app.helmrepo.user'),
            id: 'helmUser',
            type: 'text',
            editing: { hidden: true }, // if editing existing app, hide this field initially
            active: '',
            encode: true,
            placeholder: t('app.enter.helmrepo.username'),
        },
        {
            name: t('creation.app.helmrepo.password'),
            tooltip: t('tooltip.creation.app.helmrepo.password'),
            id: 'helmPassword',
            type: 'password',
            editing: { hidden: true }, // if editing existing app, hide this field initially
            encode: true,
            active: '',
            placeholder: t('app.enter.helmrepo.password'),
        },
        {
            name: t('creation.app.helmrepo.chart.name'),
            tooltip: t('tooltip.creation.app.helmrepo.chart.name'),
            id: 'helmChartName',
            type: 'text',
            syncWith: 'helmPackageAlias',
            active: '',
            placeholder: t('app.enter.helmrepo.chart.name'),
            validation: {
                required: true,
            },
            reverse: 'Subscription[0].spec.name',
        },
        {
            name: t('creation.app.helmrepo.package.alias'),
            tooltip: t('tooltip.creation.app.helmrepo.package.alias'),
            id: 'helmPackageAlias',
            type: 'text',
            syncedWith: 'helmChartName',
            active: '',
            placeholder: t('app.enter.helmrepo.package.alias'),
            validation: {
                required: true,
            },
            reverse: 'Subscription[0].spec.packageOverrides[0].packageAlias',
        },
        {
            name: t('creation.app.helmrepo.package.version'),
            tooltip: t('tooltip.creation.app.helmrepo.package.version'),
            id: 'helmPackageVersion',
            type: 'text',
            active: '',
            placeholder: t('app.enter.helmrepo.package.version'),
            reverse: 'Subscription[0].spec.packageFilter.version',
        },
        {
            id: 'helmReconcileRate',
            type: 'combobox',
            editing: { disabled: true }, // if editing existing app, disable this field
            name: t('creation.app.reconcileRate'),
            tooltip: t('tooltip.creation.app.reconcileRate'),
            active: 'medium',
            available: ['low', 'medium', 'high', 'off'],
            reverse: 'Channel[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
        },
        {
            id: 'helmSubReconcileRate',
            type: 'checkbox',
            name: t('creation.app.subReconcileRate'),
            tooltip: t('tooltip.creation.app.subReconcileRate'),
            active: false,
            available: [],
            reverse: 'Subscription[0].metadata.annotations["apps.open-cluster-management.io/reconcile-rate"]',
        },
        {
            id: 'helmInsecureSkipVerify',
            type: 'checkbox',
            name: t('creation.app.insecureSkipVerify.label'),
            tooltip: t('creation.app.insecureSkipVerify.helm.tooltip'),
            active: false,
            available: [],
            editing: { hidden: true }, // if editing existing app, hide this field initially
        },

        ...placementData(isLocalCluster, t),
    ]
}

export default helmReleaseChannelData
