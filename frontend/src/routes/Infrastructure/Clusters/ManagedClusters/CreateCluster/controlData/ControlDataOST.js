/* Copyright Contributors to the Open Cluster Management project */

import { VALIDATE_NUMERIC, VALIDATE_IP, VALIDATE_IP_OPTIONAL } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    clusterDetailsControlData,
    networkingControlData,
    automationControlData,
    getSimplifiedImageName,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
} from './ControlDataHelpers'

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

    {
        name: 'cluster.create.ocp.singleNode',
        tooltip: 'tooltip.cluster.create.ocp.singleNode',
        id: 'singleNode',
        type: 'checkbox',
        active: false,
        hidden: isHidden_lt_OCP48,
        onSelect: onChangeSNO,
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
        id: 'wpoolsStep',
        type: 'step',
        title: 'Worker pools',
        hidden: isHidden_SNO,
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
        id: 'apiFloatingIP',
        type: 'text',
        name: 'creation.ocp.cluster.ost.api.floating.ip',
        placeholder: 'placeholder.creation.ocp.cluster.ost.api.floating.ip',
        tooltip: 'tooltip.creation.ocp.cluster.ost.api.floating.ip',
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
    ...networkingControlData,
    ...automationControlData,
]

export default controlDataOST
