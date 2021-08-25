/* Copyright Contributors to the Open Cluster Management project */
import DetailsForm from '../components/assisted-installer/DetailsForm'
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
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'ai',
        type: 'custom',
        component: <DetailsForm />,
        providerId: 'ai',
    },
    ...automationControlData,
    {
        id: 'aiNetworkStep',
        type: 'step',
        title: 'Cluster network',
        disableEditor: true,
    },
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'aiNetwork',
        type: 'custom',
        component: <NetworkForm />,
        providerId: 'aiNetwork',
    },
]

export default controlDataAI
