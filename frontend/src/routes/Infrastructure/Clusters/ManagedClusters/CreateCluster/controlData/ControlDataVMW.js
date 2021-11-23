/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { VALIDATE_NUMERIC, VALIDATE_IP } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    getSimplifiedImageName,
    clusterDetailsControlData,
    proxyControlData,
    automationControlData,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
    onChangeConnection,
    onChangeDisconnect,
    addSnoText,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'

export const getControlDataVMW = (includeAutomation = true, includeSno = false) => {
    if (includeSno) addSnoText(controlDataVMW)
    if (includeAutomation) return [...controlDataVMW, ...automationControlData]
    return [...controlDataVMW]
}

const controlDataVMW = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'Infrastructure provider credential',
        tooltip:
            'The settings that are required for the selected provider. You can select an existing connection, or add a new connection. Cannot be changed after creation.',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'Select a credential',
        providerId: 'vmw',
        validation: {
            notification: 'Select a connection',
            required: true,
        },
        available: [],
        prompts: CREATE_CLOUD_CONNECTION,
        onSelect: onChangeConnection,
        encode: ['cacertificate'],
    },
    ...clusterDetailsControlData,
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'Release image',
        tooltip:
            'URL to the OpenShift install image set to use. Available images are listed, or you can enter your own path to add an image to the list. Only versions 4.5, and later, are supported for VMware vSphere.',
        id: 'imageSet',
        type: 'combobox',
        simplified: getSimplifiedImageName,
        placeholder: 'Select or enter a release image',
        fetchAvailable: LOAD_OCP_IMAGES('vmw'),
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
            ///////////////////////  coresPerSocket  /////////////////////////////////////
            {
                name: 'Cores per socket',
                tooltip: 'Cores per socket',
                id: 'masterCoresPerSocket',
                type: 'number',
                initial: '2',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  cpus  /////////////////////////////////////
            {
                name: 'CPUs',
                tooltip: 'CPUs',
                id: 'masterCpus',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'Memory (MB)',
                tooltip: 'Memory (MB)',
                id: 'masterMemoryMB',
                type: 'number',
                initial: '16384',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  root volume  /////////////////////////////////////
            {
                name: 'Disk size (GiB)',
                tooltip: 'Disk size (GiB)',
                id: 'masterRootStorage',
                type: 'number',
                initial: '120',
                validation: VALIDATE_NUMERIC,
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
            ///////////////////////  coresPerSocket  /////////////////////////////////////
            {
                name: 'Cores per socket',
                tooltip: 'Cores per socket',
                id: 'coresPerSocket',
                type: 'number',
                initial: '2',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  cpus  /////////////////////////////////////
            {
                name: 'CPUs',
                tooltip: 'CPUs',
                id: 'cpus',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'Memory (MB)',
                tooltip: 'Memory (MB)',
                id: 'memoryMB',
                type: 'number',
                initial: '16384',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  diskSizeGB  /////////////////////////////////////
            {
                name: 'Disk size (GiB)',
                tooltip: 'Disk size (GiB)',
                id: 'diskSizeGB',
                type: 'number',
                initial: '120',
                validation: VALIDATE_NUMERIC,
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

    ///////////////////////  networking  /////////////////////////////////////
    {
        id: 'networkStep',
        type: 'step',
        title: 'Networks',
    },
    {
        id: 'networkType',
        name: 'vSphere network name',
        tooltip: 'The name of the vSphere network to use.',
        placeholder: 'vSphere network name',
        type: 'text',
        active: '',
    },
    {
        id: 'apiVIP',
        type: 'text',
        name: 'API VIP',
        tooltip:
            'The Virtual IP to use for internal API communication. The DNS must be pre-configured with an A/AAAA or CNAME record so the api.<cluster name>.<Base DNS domain> path resolves correctly.',
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'ingressVIP',
        type: 'text',
        name: 'Ingress VIP',
        tooltip:
            'The Virtual IP to use for ingress traffic. The DNS must be pre-configured with an A/AAAA or CNAME record so the *.apps.<cluster name>.<Base DNS domain> path resolves correctly.',
        placeholder: 'Enter ingress VIP',
        active: '',
        validation: VALIDATE_IP,
    },
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

export default getControlDataVMW
