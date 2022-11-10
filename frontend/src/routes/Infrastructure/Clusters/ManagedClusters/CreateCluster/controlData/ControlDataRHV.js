/* Copyright Contributors to the Open Cluster Management project */

import { VALIDATE_NUMERIC, VALIDATE_IP } from '../../../../../../components/TemplateEditor'
import {
    LOAD_OCP_IMAGES,
    getSimplifiedImageName,
    clusterDetailsControlData,
    proxyControlData,
    networkingControlData,
    automationControlData,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
    architectureData,
    appendKlusterletAddonConfig,
    insertToggleModalFunction,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import installConfigHbs from '../templates/install-config.hbs'
import Handlebars from 'handlebars'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

const installConfig = Handlebars.compile(installConfigHbs)

export const getControlDataRHV = (handleModalToggle, includeAutomation = true, includeKlusterletAddonConfig = true) => {
    const controlData = [...controlDataRHV]
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
    insertToggleModalFunction(handleModalToggle, controlData)
    if (includeAutomation) {
        return [...controlData, ...automationControlData]
    }
    return controlData
}

const controlDataRHV = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        id: 'detailStep',
        type: 'step',
        title: 'Cluster details',
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        active: 'RHV',
        type: 'reviewinfo',
    },
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'redhatvirtualization',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: true,
        },
        available: [],
        encode: ['cacertificate'],
        footer: <CreateCredentialModal />,
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
        fetchAvailable: LOAD_OCP_IMAGES('rhv'),
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
        id: 'ovirt_cluster_id',
        name: 'creation.ocp.cluster.rhv.ovirt_cluster_id',
        tooltip: 'tooltip.creation.ocp.cluster.rhv.ovirt_cluster_id',
        placeholder: 'creation.ocp.cluster.rhv.ovirt_cluster_id',
        type: 'text',
        active: '',
        validation: {
            notification: 'creation.ocp.cluster.rhv.must.enter.ovirt_cluster_id',
            required: true,
        },
    },
    {
        id: 'ovirt_storage_domain_id',
        name: 'creation.ocp.cluster.rhv.ovirt_storage_domain_id',
        tooltip: 'tooltip.creation.ocp.cluster.rhv.ovirt_storage_domain_id',
        placeholder: 'creation.ocp.cluster.rhv.ovirt_storage_domain_id',
        type: 'text',
        active: '',
        validation: {
            notification: 'creation.ocp.cluster.rhv.must.enter.ovirt_storage_domain_id',
            required: true,
        },
    },
    {
        name: 'creation.ocp.addition.labels',
        id: 'additional',
        type: 'labels',
        active: [],
        tip: 'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.',
    },
    {
        id: 'infrastructure',
        active: ['RHV'],
        type: 'hidden',
        hasReplacements: true,
        availableMap: {
            RHV: {
                replacements: {
                    'install-config': { template: installConfig, encode: true, newTab: true },
                },
            },
        },
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
            ///////////////////////  coresPerSocket  /////////////////////////////////////
            ///////////////////////  cores  /////////////////////////////////////
            {
                name: 'creation.ocp.cores',
                tooltip: 'tooltip.creation.ocp.cores',
                id: 'masterCores',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  sockets  /////////////////////////////////////
            {
                name: 'creation.ocp.sockets',
                tooltip: 'tooltip.creation.ocp.sockets',
                id: 'masterSockets',
                type: 'number',
                initial: '2',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'creation.ocp.memoryMB',
                tooltip: 'tooltip.creation.ocp.memoryMB',
                id: 'masterMemoryMB',
                type: 'number',
                initial: '16348',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  root volume  /////////////////////////////////////
            {
                name: 'creation.ocp.diskSizeGB',
                tooltip: 'tooltip.creation.ocp.ovirt.diskSizeGB',
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
            ///////////////////////  cores  /////////////////////////////////////
            {
                name: 'creation.ocp.cores',
                tooltip: 'tooltip.creation.ocp.cores',
                id: 'cores',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  sockets  /////////////////////////////////////
            {
                name: 'creation.ocp.sockets',
                tooltip: 'tooltip.creation.ocp.sockets',
                id: 'sockets',
                type: 'number',
                initial: '1',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'creation.ocp.memoryMB',
                tooltip: 'tooltip.creation.ocp.memoryMB',
                id: 'memoryMB',
                type: 'number',
                initial: '16348',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  sizeGB  /////////////////////////////////////
            {
                name: 'creation.ocp.diskSizeGB',
                tooltip: 'tooltip.creation.ocp.ovirt.diskSizeGB',
                id: 'diskSizeGB',
                type: 'number',
                initial: '120',
                validation: VALIDATE_NUMERIC,
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

    ///////////////////////  networking  /////////////////////////////////////
    {
        id: 'networkStep',
        type: 'step',
        title: 'Networking',
    },
    {
        id: 'ovirt_network_name',
        name: 'creation.ocp.cluster.rhv.network.name',
        tooltip: 'tooltip.creation.ocp.cluster.rhv.network.name',
        placeholder: 'creation.ocp.cluster.rhv.network.name.placeholder',
        type: 'text',
        active: '',
        validation: {
            notification: 'creation.ocp.cluster.rhv.must.enter.network.name',
            required: true,
        },
    },
    {
        id: 'vnicProfileID',
        name: 'creation.ocp.cluster.rhv.vnicprofileid',
        tooltip: 'tooltip.creation.ocp.cluster.rhv.vnicprofileid',
        placeholder: 'creation.ocp.cluster.rhv.vnicprofileid.placeholder',
        type: 'text',
        active: '',
        validation: {
            notification: 'creation.ocp.cluster.rhv.must.enter.network.name',
            required: true,
        },
    },
    {
        id: 'apiVIP',
        type: 'text',
        name: 'creation.ocp.api.vip',
        tooltip: 'tooltip.creation.ocp.api.vip',
        placeholder: 'creation.ocp.api.vip.placeholder',
        active: '',
        validation: VALIDATE_IP,
    },
    {
        id: 'ingressVIP',
        type: 'text',
        name: 'creation.ocp.ingress.vip',
        tooltip: 'tooltip.creation.ocp.ingress.vip',
        placeholder: 'creation.ocp.ingress.vip.placeholder',
        active: '',
        validation: VALIDATE_IP,
    },
    ...networkingControlData,
    ...proxyControlData,
]

export default getControlDataRHV
