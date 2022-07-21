/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import DetailsForm from '../components/assisted-installer/hypershift/DetailsForm'
import HostsForm from '../components/assisted-installer/hypershift/HostsForm'
import NetworkForm from '../components/assisted-installer/hypershift/NetworkForm'
import {
    automationControlData,
    CREATE_CLOUD_CONNECTION,
    appendKlusterletAddonConfig,
    appendWarning,
} from './ControlDataHelpers'

export const getControlDataHypershift = (includeKlusterletAddonConfig = true, warning) => {
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataHypershift)
    appendWarning(warning, controlDataHypershift)
    return controlDataHypershift
}

const controlDataHypershift = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
        id: 'hypershiftDetailStep',
        type: 'step',
        title: 'Cluster details',
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
        title: 'Node Pools',
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
    ...automationControlData,
]
