/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import DetailsForm from '../components/assisted-installer/hypershift/DetailsForm'
import HostsForm from '../components/assisted-installer/hypershift/HostsForm'
import NetworkForm from '../components/assisted-installer/hypershift/NetworkForm'
import {
    automationControlData,
    appendKlusterletAddonConfig,
    appendWarning,
    insertToggleModalFunction,
} from './ControlDataHelpers'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

export const getControlDataHypershift = (
    handleModalToggle,
    warning,
    includeAutomation = true,
    includeKlusterletAddonConfig = true
) => {
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataHypershift)
    insertToggleModalFunction(handleModalToggle, controlDataHypershift)
    if (warning) {
        appendWarning(warning, controlDataHypershift)
    }
    if (includeAutomation) {
        return [...controlDataHypershift, ...automationControlData]
    }
    return [...controlDataHypershift]
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
        footer: <CreateCredentialModal />,
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
        title: 'Networking',
        disabled: true,
    },
    {
        id: 'hypershift-network',
        type: 'custom',
        component: <NetworkForm />,
        providerId: 'hypershift',
        mustValidate: true,
    },
]

export default getControlDataHypershift
