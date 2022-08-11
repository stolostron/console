/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import DetailsForm from '../components/assisted-installer/hypershift/DetailsForm'
import HostsForm from '../components/assisted-installer/hypershift/HostsForm'
import NetworkForm from '../components/assisted-installer/hypershift/NetworkForm'
import { automationControlData, CREATE_CLOUD_CONNECTION } from './ControlDataHelpers'

export const getControlDataHypershift = (includeKlusterletAddonConfig = true, warning) => [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
        id: 'hypershiftDetailStep',
        type: 'step',
        title: 'Cluster details',
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        active: 'Host inventory',
        type: 'reviewinfo',
    },
    {
        id: 'controlplane',
        name: 'Control plane type',
        active: 'Hosted',
        type: 'reviewinfo',
    },
    {
        id: 'warning',
        type: 'custom',
        component: warning,
    },
    /////////////////////// ACM Credentials  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'hostinventory',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: false,
        },
        available: [],
        prompts: CREATE_CLOUD_CONNECTION,
    },
    {
        id: 'hypershift',
        type: 'custom',
        component: <DetailsForm />,
        providerId: 'hypershift',
        mustValidate: true,
        encodeValues: ['pullSecret'],
        additionalProps: {
            promptSshPublicKey: false,
        },
    },
    {
        id: 'hypershiftHostsStep',
        type: 'step',
        title: 'Nodepools',
        disabled: true,
    },
    {
        id: 'hypershift-hosts',
        type: 'custom',
        component: <HostsForm />,
        providerId: 'hypershift',
        mustValidate: true,
    },
    {
        id: 'hyperhisftNetworkStep',
        type: 'step',
        title: 'Network',
        disabled: true,
    },
    {
        id: 'hypershift-network',
        type: 'custom',
        component: <NetworkForm />,
        providerId: 'hypershift',
        mustValidate: true,
    },
    {
        id: 'includeKlusterletAddonConfig',
        type: 'hidden',
        active: includeKlusterletAddonConfig,
    },
    ...automationControlData,
]
