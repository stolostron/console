/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define

import { VALIDATE_NUMERIC, VALIDATE_IP, VALIDATE_IP_OPTIONAL, VALIDATE_URL } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    clusterDetailsControlData,
    proxyControlData,
    automationControlData,
    getSimplifiedImageName,
    getOSTNetworkingControlData,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_gt_OCP46,
    isHidden_SNO,
    onChangeSNO,
    onChangeConnection,
    onChangeDisconnect,
    addSnoText,
    architectureData,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'

export const getControlDataOST = (includeAutomation = true, includeSno = false) => {
    if (includeSno) addSnoText(controlDataOST)
    if (includeAutomation) return [...controlDataOST, ...automationControlData]
    return [...controlDataOST]
}

const controlDataOST = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'ost',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: true,
        },
        available: [],
        onSelect: onChangeConnection,
        prompts: CREATE_CLOUD_CONNECTION,
    },
    ...clusterDetailsControlData,
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image',
        id: 'imageSet',
        type: 'combobox',
        simplified: getSimplifiedImageName,
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('ost'),
        validation: {
            notification: 'creation.ocp.cluster.must.select.ocp.image',
            required: true,
        },
    },
    //Always Hidden
    {
        id: 'singleNodeFeatureFlag',
        type: 'checkbox',
        active: false,
        hidden: true,
    },
    {
        name: 'cluster.create.ocp.singleNode',
        tooltip: 'tooltip.cluster.create.ocp.singleNode',
        id: 'singleNode',
        type: 'checkbox',
        active: false,
        hidden: isHidden_lt_OCP48,
        onSelect: onChangeSNO,
        icon: <DevPreviewLabel />,
    },
    {
        name: 'creation.ocp.addition.labels',
        id: 'additional',
        type: 'labels',
        active: [],
        tip: 'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.',
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  node(machine) pools  /////////////////////////////////////
    {
        id: 'nodePoolsStep',
        type: 'step',
        title: 'Node pools',
    },
    {
        id: 'nodes',
        type: 'title',
        info: 'creation.ocp.cluster.node.pool.info',
    },
    ///////////////////////  architecture  /////////////////////////////////////
    ...architectureData,
    ///////////////////////  control plane pool  /////////////////////////////////////
    {
        id: 'masterPool',
        type: 'group',
        onlyOne: true, // no prompts
        controlData: [
            {
                id: 'masterPool',
                type: 'section',
                collapsable: true,
                collapsed: true,
                subtitle: 'creation.ocp.node.controlplane.pool.title',
                info: 'creation.ocp.node.controlplane.pool.info',
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.otp.instance.type',
                id: 'masterType',
                type: 'text',
                active: 'm1.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9-_.]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: true,
                },
            },
        ],
    },
    ///////////////////////  worker pools  /////////////////////////////////////
    {
        id: 'workerPools',
        type: 'group',
        hidden: isHidden_SNO,
        prompts: {
            nameId: 'workerName',
            baseName: 'worker',
            addPrompt: 'creation.ocp.cluster.add.node.pool',
            deletePrompt: 'creation.ocp.cluster.delete.node.pool',
        },
        controlData: [
            {
                id: 'workerPool',
                type: 'section',
                collapsable: true,
                collapsed: true,
                subtitle: getWorkerName,
                info: 'creation.ocp.node.worker.pool.info',
            },
            ///////////////////////  pool name  /////////////////////////////////////
            {
                name: 'creation.ocp.pool.name',
                tooltip: 'tooltip.creation.ocp.pool.name',
                placeholder: 'creation.ocp.pool.placeholder',
                id: 'workerName',
                type: 'text',
                active: 'worker',
                validation: {
                    constraint: '[A-Za-z0-9-_]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric',
                    required: true,
                },
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.otp.instance.type',
                id: 'workerType',
                type: 'text',
                active: 'm1.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9-_.]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: true,
                },
                cacheUserValueKey: 'create.cluster.worker.type',
            },
            ///////////////////////  compute node count  /////////////////////////////////////
            {
                name: 'creation.ocp.compute.node.count',
                tooltip: 'tooltip.creation.ocp.compute.node.count',
                id: 'computeNodeCount',
                type: 'number',
                initial: '3',
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.compute.node.count',
            },
        ],
    },
    ///////////////////////  openstack  /////////////////////////////////////
    {
        id: 'networkStep',
        type: 'step',
        title: 'Networking',
    },
    {
        id: 'externalNetworkName',
        name: 'creation.ocp.cluster.ost.external.network.name',
        tooltip: 'tooltip.creation.ocp.cluster.ost.external.network.name',
        type: 'text',
        active: '',
        validation: {
            notification: 'creation.ocp.cluster.ost.must.enter.external.network.name',
            required: true,
        },
    },
    {
        id: 'lbFloatingIP',
        type: 'text',
        name: 'creation.ocp.cluster.ost.lb.floating.ip',
        placeholder: 'placeholder.creation.ocp.cluster.ost.lb.floating.ip',
        tooltip: 'tooltip.creation.ocp.cluster.ost.lb.floating.ip',
        hidden: (control, controlData) => {
            if (isHidden_gt_OCP46(control, controlData)) {
                control.active = undefined
                return true
            }
        },
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'apiFloatingIP',
        type: 'text',
        name: 'creation.ocp.cluster.ost.api.floating.ip',
        placeholder: 'placeholder.creation.ocp.cluster.ost.api.floating.ip',
        tooltip: 'tooltip.creation.ocp.cluster.ost.api.floating.ip',
        hidden: (control, controlData) => {
            if (!isHidden_gt_OCP46(control, controlData)) {
                control.active = undefined
                return true
            }
        },
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'ingressFloatingIP',
        type: 'text',
        name: 'creation.ocp.cluster.ost.ingress.floating.ip',
        placeholder: 'placeholder.creation.ocp.cluster.ost.ingress.floating.ip',
        tooltip: 'tooltip.creation.ocp.cluster.ost.ingress.floating.ip',
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'externalDNS',
        type: 'values',
        name: 'creation.ocp.cluster.ost.external.dns',
        placeholder: 'placeholder.creation.ocp.cluster.ost.external.dns',
        tooltip: 'tooltip.creation.ocp.cluster.ost.external.dns',
        active: [],
        validation: VALIDATE_IP_OPTIONAL,
    },
    ...getOSTNetworkingControlData(),
    ...proxyControlData,
    ///////////////////////  openstack  /////////////////////////////////////
    {
        id: 'disconnectedStep',
        type: 'step',
        title: 'Disconnected installation',
    },
    {
        id: 'disconnectedInfo',
        type: 'title',
        info: 'Restricted networks which do not have direct access to the Internet require a mirror location of the Red Hat Enterprise Linux CoreOS image.',
    },
    {
        name: 'Create disconnected installation',
        id: 'isDisconnected',
        type: 'checkbox',
        active: false,
        onSelect: onChangeDisconnect,
    },
    {
        id: 'clusterOSImage',
        type: 'text',
        name: 'Cluster OS image',
        disabled: true,
        tip: 'The location of the Red Hat Enterprise Linux CoreOS image in your local registry.',
        validation: VALIDATE_URL,
    },
    {
        id: 'imageContentSources',
        type: 'textarea',
        name: 'Image Content Sources',
        disabled: true,
        tip: 'The imageContentSources values that were generated during mirror registry creation.',
    },
    {
        id: 'disconnectedAdditionalTrustBundle',
        type: 'textarea',
        name: 'Additional trust bundle',
        disabled: true,
        placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
        tip: 'The contents of the certificate file that you used for your mirror registry, which can be an existing, trusted certificate authority or the self-signed certificate that you generated for the mirror registry.',
    },
]

export default getControlDataOST
