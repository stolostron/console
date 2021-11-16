/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import DetailsForm from '../components/assisted-installer/DetailsForm'
import HostsForm from '../components/assisted-installer/HostsForm'
import NetworkForm from '../components/assisted-installer/NetworkForm'
import { automationControlData, CREATE_CLOUD_CONNECTION } from './ControlDataHelpers'

const controlDataAI = [
    /////////////////////// ACM Credentials  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'hybrid',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: false,
        },
        available: [],
        prompts: CREATE_CLOUD_CONNECTION,
    },
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
        id: 'aiDetailStep',
        type: 'step',
        title: 'Cluster details',
    },
    {
        id: 'ai',
        type: 'custom',
        component: <DetailsForm />,
        providerId: 'ai',
        mustValidate: true,
        encodeValues: ['pullSecret'],
    },
    ...automationControlData,
    {
        id: 'reviewSave',
        type: 'review',
        title: 'Review and Save',
        nextButtonLabel: 'Save',
        comment:
            'Ensure these settings are correct. The saved cluster draft will be used to determine the available network resources. Therefore after you press Save you will not be able to change these cluster settings.',
        disableEditorOnSuccess: true,
        disablePreviousControlsOnSuccess: true,
    },
    {
        id: 'aiHostsStep',
        type: 'step',
        title: 'Cluster hosts',
    },
    {
        id: 'aiHosts',
        type: 'custom',
        component: <HostsForm />,
        providerId: 'aiHosts',
        mustValidate: true,
    },
    {
        id: 'aiNetworkStep',
        type: 'step',
        title: 'Cluster network',
    },
    {
        id: 'aiNetwork',
        type: 'custom',
        component: <NetworkForm />,
        providerId: 'aiNetwork',
        mustValidate: true,
    },
    {
        id: 'reviewFinish',
        type: 'review',
        title: 'Review and install',
        nextButtonLabel: 'Save and install',
    },
]

export default controlDataAI
