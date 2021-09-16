/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { VALIDATE_NUMERIC, VALIDATE_IP } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    getSimplifiedImageName,
    clusterDetailsControlData,
    automationControlData,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'

export const getControlDataVMW = (includeAutomation = true) => {
    if (includeAutomation) return [...controlDataVMW, ...automationControlData]
    return [...controlDataVMW]
}

const controlDataVMW = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'vmw',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: true,
        },
        available: [],
        prompts: CREATE_CLOUD_CONNECTION,
        encode: ['cacertificate'],
    },
    ...clusterDetailsControlData,
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image.vmw',
        id: 'imageSet',
        type: 'combobox',
        simplified: getSimplifiedImageName,
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('vmw'),
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
        tooltip: 'tooltip.creation.ocp.addition.labels',
        id: 'additional',
        type: 'labels',
        active: [],
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  node(machine) pools  /////////////////////////////////////
    {
        id: 'mpoolsStep',
        type: 'step',
        title: 'Master node',
    },
    {
        id: 'nodes',
        type: 'title',
        info: 'creation.ocp.cluster.node.pool.info',
    },
    ///////////////////////  master pool  /////////////////////////////////////
    {
        id: 'masterPool',
        type: 'group',
        onlyOne: true, // no prompts
        controlData: [
            {
                id: 'masterPool',
                type: 'section',
                collapsable: true,
                subtitle: 'creation.ocp.node.master.pool.title',
                info: 'creation.ocp.node.master.pool.info',
            },
            ///////////////////////  coresPerSocket  /////////////////////////////////////
            {
                name: 'creation.ocp.cores.per.socket',
                tooltip: 'tooltip.creation.ocp.cores.per.socket',
                id: 'masterCoresPerSocket',
                type: 'number',
                initial: '2',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  cpus  /////////////////////////////////////
            {
                name: 'creation.ocp.cpus',
                tooltip: 'tooltip.creation.ocp.cpus',
                id: 'masterCpus',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'creation.ocp.memoryMB',
                tooltip: 'tooltip.creation.ocp.memoryMB',
                id: 'masterMemoryMB',
                type: 'number',
                initial: '16384',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  root volume  /////////////////////////////////////
            {
                name: 'creation.ocp.diskSizeGB',
                tooltip: 'tooltip.creation.ocp.diskSizeGB',
                id: 'masterRootStorage',
                type: 'number',
                initial: '120',
                validation: VALIDATE_NUMERIC,
            },
        ],
    },
    ///////////////////////  worker pools  /////////////////////////////////////
    {
        id: 'wpoolsStep',
        type: 'step',
        title: 'Worker pools',
        hidden: isHidden_SNO,
    },
    {
        id: 'nodes',
        type: 'title',
        info: 'creation.ocp.cluster.node.pool.info',
    },
    {
        id: 'workerPools',
        type: 'group',
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
            ///////////////////////  coresPerSocket  /////////////////////////////////////
            {
                name: 'creation.ocp.cores.per.socket',
                tooltip: 'tooltip.creation.ocp.cores.per.socket',
                id: 'coresPerSocket',
                type: 'number',
                initial: '2',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  cpus  /////////////////////////////////////
            {
                name: 'creation.ocp.cpus',
                tooltip: 'tooltip.creation.ocp.cpus',
                id: 'cpus',
                type: 'number',
                initial: '4',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  memoryMB  /////////////////////////////////////
            {
                name: 'creation.ocp.memoryMB',
                tooltip: 'tooltip.creation.ocp.memoryMB',
                id: 'memoryMB',
                type: 'number',
                initial: '16384',
                validation: VALIDATE_NUMERIC,
            },
            ///////////////////////  diskSizeGB  /////////////////////////////////////
            {
                name: 'creation.ocp.diskSizeGB',
                tooltip: 'tooltip.creation.ocp.diskSizeGB',
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
        title: 'Networks',
    },
    {
        id: 'networkType',
        name: 'creation.ocp.cluster.vmw.network.type',
        tooltip: 'tooltip.creation.ocp.cluster.vmw.network.type',
        type: 'text',
        active: '',
    },
    {
        id: 'apiVIP',
        type: 'text',
        name: 'creation.ocp.api.vip',
        tooltip: 'tooltip.creation.ocp.api.vip',
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
]

export default getControlDataVMW
