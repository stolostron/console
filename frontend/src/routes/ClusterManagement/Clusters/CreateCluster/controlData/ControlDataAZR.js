import { VALIDATE_ALPHANUMERIC, VALIDATE_NUMERIC } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_CLOUD_CONNECTIONS,
    LOAD_OCP_IMAGES,
    networkingControlData,
    labelControlData,
} from './ControlDataHelpers'

const gp2Cpu8Gib = '2 vCPU, 8 GiB - General Purpose'
const gp4Cpu8Gib = '4 vCPU, 16 GiB - General Purpose'
const gp8Cpu8Gib = '8 vCPU, 32 GiB - General Purpose'
const gp16Cpu8Gib = '16 vCPU, 64 GiB - General Purpose'

// The list of regions can be obtained by running the following commands:
//   - Recommended regions:
//   az account list-locations --query "sort_by([].{Name:name, Category:metadata.regionCategory, Region:metadata.regionType DisplayName:displayName}, &Name)" --output table | grep Recommended
//   - Other regions:
//   az account list-locations --query "sort_by([].{Name:name, Category:metadata.regionCategory, Region:metadata.regionType DisplayName:displayName}, &Name)" --output table | grep Other
// Use all the Recommended names in the list.
// For Others, cross ref with what Azure UI shows when deploying a VM AND
// also check what OCP has : https://docs.openshift.com/container-platform/4.6/installing/installing_azure/installing-azure-account.html#installation-azure-regions_installing-azure-account

// For this regions list, place recommeneded at the top
// Recommended is top alphabetized list, others/optional is second alphabetixed list
const regions = [
    'australiaeast',
    'brazilsouth',
    'canadacentral',
    'centralindia',
    'centralus',
    'eastasia',
    'eastus',
    'eastus2',
    'francecentral',
    'germanywestcentral',
    'japaneast',
    'koreacentral',
    'northcentralus',
    'northeurope',
    'norwayeast',
    'southafricanorth',
    'southcentralus',
    'southeastasia',
    'switzerlandnorth',
    'uaenorth',
    'uksouth',
    'westeurope',
    'westus',
    'westus2',
    'australiacentral',
    'australiasoutheast',
    'canadaeast',
    'japanwest',
    'koreasouth',
    'southindia',
    'ukwest',
    'westcentralus',
    'westindia',
]

const masterInstanceTypes = [
    { value: 'Standard_D2s_v3', description: '2 vCPU, 8 GiB RAM - General Purpose' },
    { value: 'Standard_D4s_v3', description: '4 vCPU, 16 GiB RAM - General Purpose' },
    { value: 'Standard_D8s_v3', description: '8 vCPU, 32 GiB RAM - General Purpose' },
    { value: 'Standard_D16s_v3', description: '16 vCPU, 64 GiB RAM - General Purpose' },
    { value: 'Standard_D32s_v3', description: '32 vCPU, 128 GiB RAM - General Purpose' },
    { value: 'Standard_D48s_v3', description: '48 vCPU, 192 GiB RAM - General Purpose' },
    { value: 'Standard_D64s_v3', description: '64 vCPU, 256 GiB RAM - General Purpose' },
]

const ApplicationCreationPage = [
    {
        label: 'General Purpose',
        children: [
            {
                label: 'Av2-series',
                children: [
                    { value: 'Standard_A1_v2', description: '1 vCPU, 2 GiB - General Purpose' },
                    { value: 'Standard_A2_v2', description: '2 vCPU, 4 GiB - General Purpose' },
                    { value: 'Standard_A4_v2', description: '4 vCPU, 8 GiB - General Purpose' },
                    { value: 'Standard_A8_v2', description: '8 vCPU, 1 6GiB - General Purpose' },
                    { value: 'Standard_A2m_v2', description: '2 vCPU, 16 GiB - General Purpose' },
                    { value: 'Standard_A4m_v2', description: '4 vCPU, 32 GiB - General Purpose' },
                    { value: 'Standard_A8m_v2', description: '8 vCPU, 64 GiB - General Purpose' },
                ],
            },
            {
                label: 'B-series burstable virtual machine sizes',
                children: [
                    { value: 'Standard_B1ls1', description: '1 vCPU, 0.5 GiB - General Purpose' },
                    { value: 'Standard_B1s', description: '1 vCPU, 1 GiB - General Purpose' },
                    { value: 'Standard_B1ms  ', description: '1 vCPU, 2 GiB - General Purpose' },
                    { value: 'Standard_B2s', description: '2 vCPU, 4 GiB - General Purpose' },
                    { value: 'Standard_B2ms', description: gp2Cpu8Gib },
                    { value: 'Standard_B4ms', description: gp4Cpu8Gib },
                    { value: 'Standard_B8ms', description: '8  vCPU, 32 GiB - General Purpose' },
                    { value: 'Standard_B12ms', description: '12 vCPU, 48 GiB - General Purpose' },
                    { value: 'Standard_B16ms', description: gp16Cpu8Gib },
                    { value: 'Standard_B20ms', description: '20 vCPU, 80 GiB - General Purpose' },
                ],
            },
            {
                label: 'Dv2-series',
                children: [
                    { value: 'Standard_DC1s_v2', description: '1 vCPU, 4 GiB - General Purpose' },
                    { value: 'Standard_DC2s_v2', description: gp2Cpu8Gib },
                    { value: 'Standard_DC4s_v2', description: '4 vCPU, 16  GiB - General Purpose' },
                    { value: 'Standard_DC8_v2', description: '8  vCPU, 32 GiB - General Purpose' },
                    { value: 'Standard_D1_v2', description: '1 vCPU, 3.5GiB - General Purpose' },
                    { value: 'Standard_D2_v2', description: '2 vCPU, 7 GiB - General Purpose' },
                    { value: 'Standard_D3_v2', description: '4 vCPU, 14  GiB - General Purpose' },
                    { value: 'Standard_D4_v2', description: '8 vCPU, 28  GiB - General Purpose' },
                    { value: 'Standard_D5_v2', description: '16 vCPU, 56 GiB - General Purpose' },
                    { value: 'Standard_DS1_v2', description: '1  vCPU, 3.5 GiB - General Purpose' },
                    { value: 'Standard_DS2_v2', description: '2  vCPU, 7 GiB - General Purpose' },
                    { value: 'Standard_DS3_v2', description: '4  vCPU, 14  GiB - General Purpose' },
                    { value: 'Standard_DS4_v2', description: '8  vCPU, 28  GiB - General Purpose' },
                    { value: 'Standard_DS5_v2', description: '16 vCPU, 56 GiB - General Purpose' },
                ],
            },
            {
                label: 'Dv3-series',
                children: [
                    { value: 'Standard_D2_v3', description: gp2Cpu8Gib },
                    { value: 'Standard_D4_v3', description: gp4Cpu8Gib },
                    { value: 'Standard_D8_v3', description: gp8Cpu8Gib },
                    { value: 'Standard_D16_v3', description: gp16Cpu8Gib },
                    { value: 'Standard_D32_v3', description: '32 vCPU, 128GiB - General Purpose' },
                    { value: 'Standard_D48_v3', description: '48 vCPU, 192GiB - General Purpose' },
                    { value: 'Standard_D64_v3', description: '64 vCPU, 256GiB - General Purpose' },
                    { value: 'Standard_D2s_v3', description: gp2Cpu8Gib },
                    { value: 'Standard_D4s_v3', description: gp4Cpu8Gib },
                    { value: 'Standard_D8s_v3', description: gp8Cpu8Gib },
                    { value: 'Standard_D16s_v3', description: gp16Cpu8Gib },
                    { value: 'Standard_D32s_v3', description: '32 vCPU, 128GiB - General Purpose' },
                    { value: 'Standard_D48s_v3', description: '48 vCPU, 192GiB - General Purpose' },
                    { value: 'Standard_D64s_v3', description: '64 vCPU, 256GiB - General Purpose' },
                ],
            },
            {
                label: 'Dav4-series',
                children: [
                    { value: 'Standard_D2a_v4', description: '8 vCPU, 50 GiB - General Purpose' },
                    { value: 'Standard_D4a_v4', description: '16 vCPU, 100 GiB - General Purpose' },
                    { value: 'Standard_D8a_v4', description: '32 vCPU, 200 GiB - General Purpose' },
                    { value: 'Standard_D16a_v4', description: gp16Cpu8Gib },
                    { value: 'Standard_D32a_v4', description: '32 vCPU, 128 GiB - General Purpose' },
                    { value: 'Standard_D48a_v4', description: '48 vCPU, 192 GiB - General Purpose' },
                    { value: 'Standard_D64a_v4', description: '64 vCPU, 256 GiB - General Purpose' },
                    { value: 'Standard_D96a_v4', description: '96 vCPU, 384 GiB - General Purpose' },
                    { value: 'Standard_D2as_v4', description: gp2Cpu8Gib },
                    { value: 'Standard_D4as_v4', description: gp4Cpu8Gib },
                    { value: 'Standard_D8as_v4', description: gp8Cpu8Gib },
                    { value: 'Standard_D16as_v4', description: gp16Cpu8Gib },
                    { value: 'Standard_D32as_v4', description: '32 vCPU, 128 GiB - General Purpose' },
                    { value: 'Standard_D48as_v4', description: '48 vCPU, 192 GiB - General Purpose' },
                    { value: 'Standard_D64as_v4', description: '64 vCPU, 256 GiB - General Purpose' },
                    { value: 'Standard_D96as_v4', description: '96 vCPU, 384 GiB - General Purpose' },
                    { value: 'Standard_D2d_v42', description: '8 vCPU, 75 GiB - General Purpose' },
                    { value: 'Standard_D4d_v44', description: '16 vCPU, 150 GiB - General Purpose' },
                    { value: 'Standard_D8d_v48', description: '32 vCPU, 300 GiB - General Purpose' },
                    { value: 'Standard_D16d_v4', description: gp16Cpu8Gib },
                    { value: 'Standard_D32d_v4', description: '32 vCPU, 128 GiB - General Purpose' },
                    { value: 'Standard_D48d_v4', description: '48 vCPU, 192 GiB - General Purpose' },
                    { value: 'Standard_D64d_v4', description: '64 vCPU, 256 GiB - General Purpose' },
                ],
            },
        ],
    },
    {
        label: 'Compute Optimized',
        children: [
            { value: 'Standard_F4s_v2', description: '4 vCPU, 8 GiB - Compute Optimized' },
            { value: 'Standard_F8s_v2', description: '8 vCPU, 16 GiB - Compute Optimized' },
            { value: 'Standard_F16s_v2', description: '16 vCPU, 32 GiB - Compute Optimized' },
            { value: 'Standard_F32s_v2', description: '32 vCPU, 64 GiB - Compute Optimized' },
            { value: 'Standard_F48s_v2', description: '48 vCPU, 96 GiB - Compute Optimized' },
            { value: 'Standard_F64s_v2', description: '64 vCPU, 128 GiB - Compute Optimized' },
            { value: 'Standard_F72s_v21', description: '72 vCPU, 144 GiB - Compute Optimized' },
        ],
    },
    {
        label: 'Memory Optimized',
        children: [
            {
                label: 'Dv2-series',
                children: [
                    { value: 'Standard_D11_v2', description: '2 vCPU, 14 GiB - Memory Optimized' },
                    { value: 'Standard_D12_v2', description: '4 vCPU, 28 GiB - Memory Optimized' },
                    { value: 'Standard_D13_v2', description: '8 vCPU, 56 GiB - Memory Optimized' },
                    { value: 'Standard_D14_v2', description: '16 vCPU, 112 GiB - Memory Optimized' },
                    { value: 'Standard_D15_v2', description: '1  vCPU, 20 GiB - Memory Optimized' },
                    { value: 'Standard_DS11_v2', description: '3 vCPU, 2 GiB - Memory Optimized' },
                    { value: 'Standard_DS12_v2', description: '3 vCPU, 4 GiB - Memory Optimized' },
                    { value: 'Standard_DS13_v2', description: '3 vCPU, 8 GiB - Memory Optimized' },
                    { value: 'Standard_DS14_v2', description: '3 vCPU, 16 GiB - Memory Optimized' },
                    { value: 'Standard_DS15_v2', description: '2 vCPU, 20 GiB - Memory Optimized' },
                ],
            },
            {
                label: 'Ev3-series',
                children: [
                    { value: 'Standard_E2_v3', description: '2 vCPU, 16 GiB - Memory Optimized' },
                    { value: 'Standard_E4_v3', description: '4 vCPU, 32 GiB - Memory Optimized' },
                    { value: 'Standard_E8_v3', description: '8 vCPU, 64 GiB - Memory Optimized' },
                    { value: 'Standard_E16_v3', description: '16 vCPU, 128 GiB - Memory Optimized' },
                    { value: 'Standard_E20_v3', description: '20 vCPU, 160 GiB - Memory Optimized' },
                    { value: 'Standard_E32_v3', description: '32 vCPU, 256 GiB - Memory Optimized' },
                    { value: 'Standard_E48_v3', description: '48 vCPU, 384 GiB - Memory Optimized' },
                    { value: 'Standard_E64_v3', description: '64 vCPU, 432 GiB - Memory Optimized' },
                    { value: 'Standard_E64i_v3', description: '64 vCPU, 432 GiB - Memory Optimized' },
                    { value: 'Standard_E2s_v3', description: '16 vCPU, 32 GiB - Memory Optimized' },
                    { value: 'Standard_E4s_v3', description: '4 vCPU, 32 GiB - Memory Optimized' },
                    { value: 'Standard_E8s_v3', description: '8 vCPU, 64 GiB - Memory Optimized' },
                    { value: 'Standard_E16s_v3', description: '16 vCPU, 128 GiB - Memory Optimized' },
                    { value: 'Standard_E20s_v3', description: '20 vCPU, 160 GiB - Memory Optimized' },
                    { value: 'Standard_E32s_v3', description: '32 vCPU, 256 GiB - Memory Optimized' },
                    { value: 'Standard_E48s_v3', description: '48 vCPU, 384 GiB - Memory Optimized' },
                    { value: 'Standard_E64s_v3', description: '64 vCPU, 432 GiB - Memory Optimized' },
                    { value: 'Standard_E64is_v3', description: '64 vCPU, 432 GiB - Memory Optimized' },
                ],
            },
            {
                label: 'Eav4-series',
                children: [
                    { value: 'Standard_E2a_v4', description: '16 vCPU, 50  GiB - Memory Optimized' },
                    { value: 'Standard_E4a_v4', description: '32 vCPU, 100 GiB - Memory Optimized' },
                    { value: 'Standard_E8a_v4', description: '64 vCPU, 200 GiB - Memory Optimized' },
                    { value: 'Standard_E16a_v4', description: '16 vCPU, 128 GiB - Memory Optimized' },
                    { value: 'Standard_E20a_v4', description: '20 vCPU, 160 GiB - Memory Optimized' },
                    { value: 'Standard_E32a_v4', description: '32 vCPU, 256 GiB - Memory Optimized' },
                    { value: 'Standard_E48a_v4', description: '48 vCPU, 384 GiB - Memory Optimized' },
                    { value: 'Standard_E64a_v4', description: '64 vCPU, 512 GiB - Memory Optimized' },
                    { value: 'Standard_E96a_v4', description: '96 vCPU, 672 GiB - Memory Optimized' },
                    { value: 'Standard_E2ds_v4', description: '2 vCPU, 16 GiB - Memory Optimized' },
                    { value: 'Standard_E4ds_v4', description: '4 vCPU, 32 GiB - Memory Optimized' },
                    { value: 'Standard_E8ds_v4', description: '8 vCPU, 64 GiB - Memory Optimized' },
                    { value: 'Standard_E16ds_v4', description: '16 vCPU, 128 GiB - Memory Optimized' },
                    { value: 'Standard_E20ds_v4', description: '20 vCPU, 160 GiB - Memory Optimized' },
                    { value: 'Standard_E32ds_v4', description: '32 vCPU, 256 GiB - Memory Optimized' },
                    { value: 'Standard_E48ds_v4', description: '48 vCPU, 384 GiB - Memory Optimized' },
                    { value: 'Standard_E64ds_v4', description: '64 vCPU, 504 GiB - Memory Optimized' },
                ],
            },
            {
                label: 'M-series',
                children: [
                    { value: 'Standard_M8ms', description: '8 vCPU, 218.75 GiB - Memory Optimized' },
                    { value: 'Standard_M16ms', description: '16 vCPU, 437.5 GiB - Memory Optimized' },
                    { value: 'Standard_M32ts', description: '32 vCPU, 192 GiB - Memory Optimized' },
                    { value: 'Standard_M32ls', description: '32 vCPU, 256 GiB - Memory Optimized' },
                    { value: 'Standard_M32ms', description: '32 vCPU, 875 GiB - Memory Optimized' },
                    { value: 'Standard_M64s', description: '64 vCPU, 1024 GiB - Memory Optimized' },
                    { value: 'Standard_M64ls', description: '64  vCPU, 512 GiB - Memory Optimized' },
                    { value: 'Standard_M64ms', description: '64  vCPU, 1792 GiB - Memory Optimized' },
                    { value: 'Standard_M128s', description: '128 vCPU, 2048 GiB - Memory Optimized' },
                    { value: 'Standard_M128ms', description: '128 vCPU, 3892 GiB - Memory Optimized' },
                    { value: 'Standard_M64', description: '64 vCPU, 1024 GiB - Memory Optimized' },
                    { value: 'Standard_M64m', description: '64  vCPU, 1792 GiB - Memory Optimized' },
                    { value: 'Standard_M128', description: '128 vCPU, 2048 GiB - Memory Optimized' },
                    { value: 'Standard_M128m', description: '128 vCPU, 3892 GiB - Memory Optimized' },
                ],
            },
            {
                label: 'Mv2-series',
                children: [
                    { value: 'Standard_M208ms_v21', description: '208 vCPU, 5700 GiB - Memory Optimized' },
                    { value: 'Standard_M208s_v21', description: '208 vCPU, 2850  GiB - Memory Optimized' },
                    { value: 'Standard_M416ms_v21', description: '416 vCPU, 11400GiB - Memory Optimized' },
                    { value: 'Standard_M416s_v21', description: '416 vCPU, 5700GiB - Memory Optimized' },
                ],
            },
        ],
    },
    {
        label: 'Storage Optimized',
        children: [
            { value: 'Standard_L8s_v2', description: '64 vCPU, 80  GiB - Storage Optimized' },
            { value: 'Standard_L16s_v2', description: '16 vCPU, 128 GiB - Storage Optimized' },
            { value: 'Standard_L32s_v2', description: '32 vCPU, 256 GiB - Storage Optimized' },
            { value: 'Standard_L48s_v2', description: '48 vCPU, 384 GiB - Storage Optimized' },
            { value: 'Standard_L64s_v2', description: '64 vCPU, 512 GiB - Storage Optimized' },
            { value: 'Standard_L80s_v26', description: '80 vCPU, 640 GiB - Storage Optimized' },
        ],
    },
    {
        label: 'GPU Accelerated Compute',
        children: [
            {
                label: 'NC-series',
                children: [
                    {
                        value: 'Standard_NC6',
                        description: '6 vCPU, 56 GiB, 12 GPUs, 24 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC12',
                        description: '12 vCPU, 112 GiB, 24 GPUs, 48 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24',
                        description: '24 vCPU, 224 GiB, 4 GPUs, 48 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24r',
                        description: '24 vCPU, 224 GiB, 4 GPUs, 48 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC6s_v2',
                        description: '6 vCPU, 112 GiB, 16 GPUs, 12 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC12s_v2',
                        description: '12 vCPU, 224 GiB, 2 GPUs, 32 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24s_v2',
                        description: '24 vCPU, 448 GiB, 4 GPUs, 64 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24rs_v2',
                        description: '24 vCPU, 448 GiB, GPUs, GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC6s_v3',
                        description: '6 vCPU, 112 GiB, 16 GPUs, 12 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC12s_v3',
                        description: '12 vCPU, 224 GiB, 2 GPUs, 32 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24s_v3',
                        description: '24 vCPU, 448 GiB, 4 GPUs, 64 GPU GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NC24rs_v3',
                        description: '24 vCPU, 448 GiB, GPUs, GPU GiB- GPU Accelerated Compute',
                    },
                ],
            },
            {
                label: 'ND-series',
                children: [
                    {
                        value: 'Standard_ND6s',
                        description: '6 vCPU, 112 GiB, GPUs,24 GPU 12GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_ND12s',
                        description: '12 vCPU, 224 GiB, GPUs,48 GPU 24GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_ND24s',
                        description: '24 vCPU, 448 GiB, GPUs,96 GPU 32GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_ND24rs',
                        description: '24 vCPU, 448 GiB, GPUs, GPU GiB- GPU Accelerated Compute',
                    },
                ],
            },
            {
                label: 'NV-series',
                children: [
                    {
                        value: 'Standard_NV6',
                        description: '6 vCPU, 56 GiB, GPUs, 8 GPU 24GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV12',
                        description: '12 vCPU, 112 GiB, GPUs,16 GPU 48GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV24',
                        description: '24 vCPU, 224 GiB, GPUs,4 GPU 32GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV12s_v3',
                        description: '12 vCPU, 112 GiB, GPUs,8 GPU 12GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV24s_v3',
                        description: '24 vCPU, 224 GiB, GPUs,16 GPU 24GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV48s_v3',
                        description: '48 vCPU, 448 GiB, GPUs,4 GPU 32GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV4as_v4',
                        description: '4 vCPU, 14 GiB, GPUs,2 GPU 4 GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV8as_v4',
                        description: '8 vCPU, 28  GiB, GPUs,4  GPU 8 GiB- GPU Accelerated Compute',
                    },
                    {
                        value: 'Standard_NV16as_v4',
                        description: '16 vCPU, 56 GiB, GPUs,8  GPU 16 GiB- GPU Accelerated Compute',
                    },
                ],
            },
        ],
    },
    {
        label: 'High Performance Compute',
        children: [
            { value: 'Standard_H8', description: '8 vCPU, 56 GiB RAM - High Performance Compute' },
            { value: 'Standard_H16', description: '16 vCPU, 112 GiB RAM - High Performance Compute' },
            { value: 'Standard_H8m', description: '8 vCPU, 112 GiB RAM - High Performance Compute' },
            { value: 'Standard_H16m', description: '16 vCPU, 224 GiB RAM - High Performance Compute' },
            { value: 'Standard_H16r', description: '16 vCPU, 112 GiB RAM - High Performance Compute' },
            { value: 'Standard_H16mr', description: '16 vCPU, 224 GiB RAM - High Performance Compute' },
        ],
    },
]

const controlDataAZR = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image',
        id: 'imageSet',
        type: 'combobox',
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('azr'),
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
        fetchAvailable: LOAD_CLOUD_CONNECTIONS('azr'),
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
        tooltip: 'tooltip.creation.ocp.azr.region',
        id: 'region',
        type: 'combobox',
        active: 'centralus',
        available: regions,
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
                tooltip: 'tooltip.creation.ocp.azr.instance.type',
                learnMore: 'https://docs.microsoft.com/en-us/azure/virtual-machines/sizes-general',
                id: 'masterType',
                type: 'combobox',
                available: masterInstanceTypes,
                active: 'Standard_D4s_v3',
                validation: {
                    constraint: '[A-Za-z0-9_]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: false,
                },
                cacheUserValueKey: 'create.cluster.master.type',
            },
            ///////////////////////  root volume  /////////////////////////////////////
            {
                name: 'creation.ocp.root.storage',
                tooltip: 'tooltip.creation.ocp.azr.root.storage',
                id: 'masterRootStorage',
                type: 'combobox',
                active: '128',
                available: ['128', '256', '512', '1024', '2048'],
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
            ///////////////////////  zone  /////////////////////////////////////
            {
                name: 'creation.ocp.zones',
                tooltip: 'tooltip.creation.ocp.worker.zones',
                id: 'workerZones',
                type: 'multiselect',
                active: ['1', '2', '3'],
                available: ['1', '2', '3'],
                cacheUserValueKey: 'create.cluster.aws.worker.zones',
                validation: VALIDATE_ALPHANUMERIC,
                multiselect: true,
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.azr.instance.type',
                learnMore: 'https://docs.microsoft.com/en-us/azure/virtual-machines/sizes-general',
                id: 'workerType',
                type: 'treeselect',
                available: ApplicationCreationPage,
                active: 'Standard_D2s_v3',
                validation: {
                    constraint: '[A-Za-z0-9_]+',
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
            ///////////////////////  storage  /////////////////////////////////////
            {
                name: 'creation.ocp.root.storage',
                tooltip: 'tooltip.creation.ocp.azr.root.storage',
                id: 'workerStorage',
                type: 'combobox',
                active: '128',
                available: ['128', '256', '512', '1024', '2048'],
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.persistent.storage',
            },
        ],
    },
    ...networkingControlData,
]

export default controlDataAZR
