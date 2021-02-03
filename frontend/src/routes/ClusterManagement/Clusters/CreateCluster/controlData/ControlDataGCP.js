import { VALIDATE_ALPHANUMERIC, VALIDATE_NUMERIC } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_CLOUD_CONNECTIONS,
    LOAD_OCP_IMAGES,
    networkingControlData,
    labelControlData,
} from './ControlDataHelpers'

const GCPregions = [
    'asia-east1',
    'asia-east2',
    'asia-northeast1',
    'asia-northeast2',
    'asia-northeast3',
    'asia-south1',
    'asia-southeast1',
    'australia-southeast1',
    'europe-north1',
    'europe-west1',
    'europe-west2',
    'europe-west3',
    'europe-west4',
    'europe-west6',
    'northamerica-northeast1',
    'southamerica-east1',
    'us-central1',
    'us-east1',
    'us-east4',
    'us-west1',
    'us-west2',
]

const GCPmasterInstanceTypes = [
    { value: 'n1-standard-4', description: 'n1-standard-4 4 vCPU - General Purpose' },
    { value: 'n1-standard-8', description: 'n1-standard-8 8 vCPU - General Purpose' },
    { value: 'n1-standard-16', description: 'n1-standard-16 16 vCPU - General Purpose' },
    { value: 'n1-standard-32', description: 'n1-standard-32 32 vCPU - General Purpose' },
    { value: 'n1-standard-64', description: 'n1-standard-64 64 vCPU - General Purpose' },
    { value: 'n1-standard-96', description: 'n1-standard-96 96 vCPU - General Purpose' },
]

const GCPworkerInstanceTypes = [
    {
        label: 'General Purpose',
        children: [
            {
                label: 'E2 machine types',
                children: [
                    {
                        label: 'E2 standard machine types',
                        children: [
                            { value: 'e2-standard-2', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'e2-standard-4', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'e2-standard-8', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'e2-standard-16', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'E2 high-memory machine types',
                        children: [
                            { value: 'e2-highmem-2', description: '2 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'e2-highmem-4', description: '4 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'e2-highmem-8', description: '8 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'e2-highmem-16', description: '16 vCPU, 128 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'E2 high-CPU machine types',
                        children: [
                            { value: 'e2-highcpu-2', description: '2 vCPU, 2 GiB RAM - General Purpose' },
                            { value: 'e2-highcpu-4', description: '4 vCPU, 4 GiB RAM - General Purpose' },
                            { value: 'e2-highcpu-8', description: '8 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'e2-highcpu-16', description: '16 vCPU, 16 GiB RAM - General Purpose' },
                        ],
                    },
                ],
            },

            {
                label: 'N2 machine types',
                children: [
                    {
                        label: 'N2 standard machine types',
                        children: [
                            { value: 'n2-standard-2', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'n2-standard-4', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2-standard-8', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2-standard-16', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2-standard-32', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'n2-standard-48', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'n2-standard-64', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'n2-standard-80', description: '80 vCPU, 320 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N2 high-memory machine types',
                        children: [
                            { value: 'n2-highmem-2', description: '2 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-4', description: '4 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-8', description: '8 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-16', description: '16 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-32', description: '32 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-48', description: '48 vCPU, 384 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-64', description: '64 vCPU, 512 GiB RAM - General Purpose' },
                            { value: 'n2-highmem-80', description: '80 vCPU, 640 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N2 high-CPU machine types',
                        children: [
                            { value: 'n2-highcpu-2', description: '2 vCPU, 2 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-4', description: '4 vCPU, 4 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-8', description: '8 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-16', description: '16 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-32', description: '32 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-48', description: '48 vCPU, 48 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-64', description: '64 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2-highcpu-80', description: '80 vCPU, 80 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N2D standard machine types with SSD',
                        children: [
                            { value: 'n2d-standard-2', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-4', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-8', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-16', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-32', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-48', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-64', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-80', description: '80 vCPU, 320 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-96', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-128', description: '128 vCPU, 512 GiB RAM - General Purpose' },
                            { value: 'n2d-standard-224', description: '224 vCPU, 896 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N2D high-memory machine types with SSD',
                        children: [
                            { value: 'n2d-highmem-2', description: '2 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-4', description: '4 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-8', description: '8 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-16', description: '16 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-32', description: '32 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-48', description: '48 vCPU, 384 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-64', description: '64 vCPU, 512 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-80', description: '80 vCPU, 640 GiB RAM - General Purpose' },
                            { value: 'n2d-highmem-96', description: '96 vCPU, 768 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N2D high-CPU machine types with SSD',
                        children: [
                            { value: 'n2d-highcpu-2', description: '2 vCPU, 2 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-4', description: '4 vCPU, 4 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-8', description: '8 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-16', description: '16 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-32', description: '32 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-48', description: '48 vCPU, 48 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-64', description: '64 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-80', description: '80 vCPU, 80 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-96', description: '96 vCPU, 96 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-128', description: '128 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'n2d-highcpu-224', description: '224 vCPU, 224 GiB RAM - General Purpose' },
                        ],
                    },
                ],
            },

            {
                label: 'N1 machine types',
                children: [
                    {
                        label: 'N1 standard machine types',
                        children: [
                            { value: 'n1-standard-1', description: '1 vCPU, 3.75 GiB RAM - General Purpose' },
                            { value: 'n1-standard-2', description: '2 vCPU, 7.50 GiB RAM - General Purpose' },
                            { value: 'n1-standard-4', description: '4 vCPU, 15 GiB RAM - General Purpose' },
                            { value: 'n1-standard-8', description: '8 vCPU, 30 GiB RAM - General Purpose' },
                            { value: 'n1-standard-16', description: '16 vCPU, 60 GiB RAM - General Purpose' },
                            { value: 'n1-standard-32', description: '32 vCPU, 120 GiB RAM - General Purpose' },
                            { value: 'n1-standard-64', description: '64 vCPU, 240 GiB RAM - General Purpose' },
                            { value: 'n1-standard-96', description: '96 vCPU, 360 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N1 high-memory machine types',
                        children: [
                            { value: 'n1-highmem-2', description: '2 vCPU, 13 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-4', description: '4 vCPU, 26 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-8', description: '8 vCPU, 52 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-16', description: '16 vCPU, 104 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-32', description: '32 vCPU, 208 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-64', description: '64 vCPU, 416 GiB RAM - General Purpose' },
                            { value: 'n1-highmem-96', description: '96 vCPU, 624 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'N1 high-CPU machine types',
                        children: [
                            { value: 'n1-highcpu-2', description: '2 vCPU, 1.80 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-4', description: '4 vCPU, 3.60 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-8', description: '8 vCPU, 7.20 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-16', description: '16 vCPU, 14.4 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-32', description: '32 vCPU, 28.8 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-64', description: '64 vCPU, 57.6 GiB RAM - General Purpose' },
                            { value: 'n1-highcpu-96', description: '96 vCPU, 86.4 GiB RAM - General Purpose' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: 'Compute Optimized',
        children: [
            { value: 'c2-standard-4', description: '4 vCPU, 16 GiB RAM - Compute Optimized' },
            { value: 'c2-standard-8', description: '8 vCPU, 32 GiB RAM - Compute Optimized' },
            { value: 'c2-standard-16', description: '16 vCPU, 64 GiB RAM - Compute Optimized' },
            { value: 'c2-standard-30', description: '30 vCPU, 120 GiB RAM - Compute Optimized' },
            { value: 'c2-standard-60', description: '60 vCPU, 240 GiB RAM - Compute Optimized' },
        ],
    },
    {
        label: 'Memory Optimized',
        children: [
            { value: 'm2-ultramem-2084', description: '208 vCPU, 5888 GiB RAM - Memory Optimized' },
            { value: 'm2-ultramem-4164', description: '416 vCPU, 11,776 GiB RAM - Memory Optimized' },
            { value: 'm1-ultramem-40', description: '40 vCPU, 961 GiB RAM - Memory Optimized' },
            { value: 'm1-ultramem-80', description: '80 vCPU, 1922 GiB RAM - Memory Optimized' },
            { value: 'm1-ultramem-160', description: '160 vCPU, 3844 GiB RAM - Memory Optimized' },
            { value: 'm1-megamem-96', description: '96 vCPU, 1433.6 GiB RAM - Memory Optimized' },
        ],
    },
]

const controlDataGCP = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image',
        id: 'imageSet',
        type: 'combobox',
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('gcp'),
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
        fetchAvailable: LOAD_CLOUD_CONNECTIONS('gcp'),
        prompts: CREATE_CLOUD_CONNECTION,
    },
    ...labelControlData,

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
    ///////////////////////  region  /////////////////////////////////////
    {
        name: 'creation.ocp.region',
        tooltip: 'tooltip.creation.ocp.gcp.region',
        id: 'region',
        type: 'combobox',
        active: 'us-east1',
        available: GCPregions,
        validation: VALIDATE_ALPHANUMERIC,
        cacheUserValueKey: 'create.cluster.region',
        reverse: 'ClusterDeployment[0].metadata.labels.region',
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
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.gcp.instance.type',
                learnMore: 'https://cloud.google.com/compute/docs/machine-types',
                id: 'masterType',
                type: 'combobox',
                available: GCPmasterInstanceTypes,
                active: 'n1-standard-4',
                validation: {
                    constraint: '[A-Za-z0-9-]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: false,
                },
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
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.gcp.instance.type',
                learnMore: 'https://cloud.google.com/compute/docs/machine-types',
                id: 'workerType',
                type: 'treeselect',
                available: GCPworkerInstanceTypes,
                active: 'n1-standard-4',
                validation: {
                    constraint: '[A-Za-z0-9-]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: false,
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
    ...networkingControlData,
]

export default controlDataGCP
