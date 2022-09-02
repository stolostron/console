/* Copyright Contributors to the Open Cluster Management project */

import DetailsForm from '../components/assisted-installer/DetailsForm'
import {
    automationControlData,
    appendKlusterletAddonConfig,
    appendWarning,
    insertToggleModalFunction,
} from './ControlDataHelpers'
import { ModalWithWizard } from '../components/CreateCredentialModal'

export const getControlDataCIM = (includeKlusterletAddonConfig = true, warning, handleModalToggle) => {
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataCIM)
    insertToggleModalFunction(handleModalToggle, controlDataCIM)
    if (warning) {
        appendWarning(warning, controlDataCIM)
    }
    return [...controlDataCIM]
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
        id: 'infrastructure',
        name: 'Infrastructure',
        active: 'Host inventory',
        type: 'reviewinfo',
    },
    {
        id: 'controlplane',
        name: 'Control plane type',
        active: 'Standalone',
        type: 'reviewinfo',
    },
    /////////////////////// ACM Credentials  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: ['hybrid', 'hostinventory'],
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: false,
        },
        available: [],
        footer: <ModalWithWizard />,
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

export default getControlDataCIM
