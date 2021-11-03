/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import _ from 'lodash'
import DetailsForm from '../components/assisted-installer/DetailsForm'
import CIMHostsForm from '../components/assisted-installer/CIMHostsForm'
import AIHostsForm from '../components/assisted-installer/AIHostsForm'
import NetworkForm from '../components/assisted-installer/NetworkForm'
import { automationControlData, CREATE_CLOUD_CONNECTION } from './ControlDataHelpers'

export const controlDataCIM = [
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
// TODO(mlibra): That placing is for development only, see below
    // {
    //     id: 'aiHosts',
    //     type: 'custom',
    //     component: null, // will be defined later
    //     providerId: 'aiHosts',
    //     mustValidate: true,
    // },

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
        additionalProps: {
            promptSshPublicKey: false,
        }
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
        component: null, // will be defined later
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

export const controlDataAI = _.cloneDeep(controlDataCIM);

const aiHostsStep = controlDataAI.find((data) => data.id === 'aiHosts');
aiHostsStep.component = <AIHostsForm />;

const cimHostsStep = controlDataCIM.find((data) => data.id === 'aiHosts');
cimHostsStep.component = <CIMHostsForm />;

const aiStep = controlDataAI.find((data) => data.id === 'ai');
aiStep.additionalProps.promptSshPublicKey = true;
