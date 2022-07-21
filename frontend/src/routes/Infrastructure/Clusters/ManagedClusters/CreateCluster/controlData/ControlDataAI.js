/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import DetailsForm from '../components/assisted-installer/DetailsForm'
import { automationControlData, CREATE_CLOUD_CONNECTION, appendKlusterletAddonConfig } from './ControlDataHelpers'

export const getControlDataCIM = (includeKlusterletAddonConfig = true) => {
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataCIM)
    return controlDataCIM
}

const controlDataCIM = [
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
        additionalProps: {
            promptSshPublicKey: false,
        },
    },
    ...automationControlData,
    {
        id: 'reviewSave',
        type: 'review',
        title: 'Review and save',
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
        disabled: true,
    },
    {
        id: 'aiNetworkStep',
        type: 'step',
        title: 'Cluster network',
        disabled: true,
    },
]

export const getControlDataAI = (includeKlusterletAddonConfig = true) => {
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataAI)
    return controlDataAI
}

const controlDataAI = _.cloneDeep(controlDataCIM)

const aiStep = controlDataAI.find((data) => data.id === 'ai')
aiStep.additionalProps.promptSshPublicKey = true
