/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { VALIDATE_NUMERIC, VALIDATE_IP, VALIDATE_IP_OPTIONAL, VALIDATE_URL } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    clusterDetailsControlData,
    networkingControlData,
    proxyControlData,
    automationControlData,
    getSimplifiedImageName,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
    onChangeConnection,
    onChangeDisconnect,
    addSnoText,
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
        name: 'Infrastructure provider credential',
        tooltip:
            'The settings that are required for the selected provider. You can select an existing connection, or add a new connection. Cannot be changed after creation.',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'Select a credential',
        providerId: 'ost',
        validation: {
            notification: 'Select a connection',
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
        name: 'URL to the OpenShift install image set to use. Available images are listed, or you can enter your own path to add an image to the list.',
        tooltip:
            'URL to the OpenShift install image set to use. Available images are listed, or you can enter your own path to add an image to the list.',
        id: 'imageSet',
        type: 'combobox',
        simplified: getSimplifiedImageName,
        placeholder: 'Select or enter a release image',
        fetchAvailable: LOAD_OCP_IMAGES('ost'),
        validation: {
            notification: 'Select a release image',
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
        name: 'Single Node OpenShift',
        tooltip:
            'To enable a single node OpenShift cluster with one control plane node and zero worker nodes. Only available in OpenShift 4.8 and higher.',
        id: 'singleNode',
        type: 'checkbox',
        active: false,
        hidden: isHidden_lt_OCP48,
        onSelect: onChangeSNO,
        icon: <DevPreviewLabel />,
    },
    {
        name: 'Additional labels',
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
        info: 'The instance type and quantity of control plane and worker nodes to create for your cluster. Additional worker nodes can be added after the cluster is created.',
    },
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
                subtitle: 'Control plane pool',
                info: 'Three control plane nodes will be created to control this cluster.',
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'Instance type',
                tooltip: 'The OpenStack compute flavor.',
                id: 'masterType',
                type: 'text',
                active: 'm1.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9-_.]+',
                    notification: 'Value must be alphanumeric, including periods.',
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
            addPrompt: 'Add worker pool',
            deletePrompt: 'Delete node pool',
        },
        controlData: [
            {
                id: 'workerPool',
                type: 'section',
                collapsable: true,
                collapsed: true,
                subtitle: getWorkerName,
                info: 'One or more worker nodes will be created to run the container workloads in this cluster.',
            },
            ///////////////////////  pool name  /////////////////////////////////////
            {
                name: 'Pool name',
                tooltip: 'The name for your worker pool.',
                placeholder: 'Enter pool name',
                id: 'workerName',
                type: 'text',
                active: 'worker',
                validation: {
                    constraint: '[A-Za-z0-9-_]+',
                    notification: 'Value must be alphanumeric.',
                    required: true,
                },
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'Instance type',
                tooltip: 'The OpenStack compute flavor.',
                id: 'workerType',
                type: 'text',
                active: 'm1.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9-_.]+',
                    notification: 'Value must be alphanumeric, including periods.',
                    required: true,
                },
                cacheUserValueKey: 'create.cluster.worker.type',
            },
            ///////////////////////  compute node count  /////////////////////////////////////
            {
                name: 'Node count',
                tooltip: 'The number of nodes in this node pool.',
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
        name: 'External network name',
        tooltip: 'The name for the external OpenStack network.',
        type: 'text',
        active: '',
        validation: {
            notification: 'External network name is required.',
            required: true,
        },
    },
    {
        id: 'apiFloatingIP',
        type: 'text',
        name: 'API floating IP',
        placeholder: 'Enter API floating IP',
        tooltip: 'The existing floating IP address on the external network for the OpenShift API.',
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'ingressFloatingIP',
        type: 'text',
        name: 'Ingress floating IP',
        placeholder: 'Enter ingress floating IP',
        tooltip: 'The existing floating IP address on the external network for the ingress port.',
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'externalDNS',
        type: 'values',
        name: 'External DNS IP addresses',
        placeholder: '(Optional) Enter one or more external DNS IP addresses',
        tooltip: 'The external DNS IP addresses for name resolution on the private network.',
        active: [],
        validation: VALIDATE_IP_OPTIONAL,
    },
    ...networkingControlData,
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
        info: 'Restricted networks which do not have direct access to the Internet require a mirror location of the Red Hat Enterprise Linux CoreOS (RHCOS) image.',
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
        name: 'Cluster OS Image',
        disabled: true,
        tip: 'The location of the Red Hat Enterprise Linux CoreOS (RHCOS) image in your local registry.',
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
        name: 'Additional Trust Bundle',
        disabled: true,
        placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
        tip: 'The contents of the certificate file that you used for your mirror registry, which can be an existing, trusted certificate authority or the self-signed certificate that you generated for the mirror registry.',
    },
]

export default getControlDataOST
