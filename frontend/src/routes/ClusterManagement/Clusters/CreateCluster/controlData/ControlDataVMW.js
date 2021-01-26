import { VALIDATE_NUMERIC, VALIDATE_IP, VALIDATE_BASE_DNS_NAME_REQUIRED } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_CLOUD_CONNECTIONS,
    LOAD_OCP_IMAGES,
    labelControlData,
} from './ControlDataHelpers'

const vmwControlData = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image.vmw',
        id: 'imageSet',
        type: 'combobox',
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('vmw'),
        validation: {
            notification: 'creation.ocp.cluster.must.select.ocp.image',
            required: true,
        },
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: true,
        },
        fetchAvailable: LOAD_CLOUD_CONNECTIONS('vmw'),
        prompts: CREATE_CLOUD_CONNECTION,
        encode: ['cacertificate'],
    },
    ...labelControlData,

    ///////////////////////  networking  /////////////////////////////////////
    {
        id: 'networking',
        type: 'section',
        title: 'creation.ocp.networking',
        overline: true,
        collapsable: true,
        collapsed: false,
    },
    {
        name: 'creation.ocp.baseDomain',
        tooltip: 'tooltip.creation.ocp.baseDomain',
        id: 'baseDomain',
        type: 'text',
        validation: VALIDATE_BASE_DNS_NAME_REQUIRED,
    },
    {
        id: 'networkType',
        name: 'creation.ocp.cluster.vmw.network.type',
        tooltip: 'tooltip.creation.ocp.cluster.vmw.network.type',
        type: 'text',
        active: 'Public Network',
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
        active: '',
        validation: VALIDATE_IP,
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  node(machine) pools  /////////////////////////////////////
    {
        id: 'nodes',
        type: 'section',
        title: 'creation.ocp.node.pools',
        info: 'creation.ocp.cluster.node.pool.info',
        overline: true,
        collapsable: true,
        collapsed: true,
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
                subtitle: 'creation.ocp.node.master.pool.title',
                info: 'creation.ocp.node.master.pool.info',
                collapsable: true,
                collapsed: true,
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
                name: 'creation.ocp.root.storage',
                tooltip: 'tooltip.creation.ocp.vmw.root.storage',
                id: 'masterRootStorage',
                type: 'combobox',
                active: '100',
                available: ['100', '300', '500', '800', '1000', '1200'],
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.master.root.storage',
            },
        ],
    },
    ///////////////////////  worker pools  /////////////////////////////////////
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
                subtitle: 'creation.ocp.node.worker.pool.title',
                info: 'creation.ocp.node.worker.pool.info',
                collapsable: true,
                collapsed: true,
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
]

export default vmwControlData
