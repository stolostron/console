/* Copyright Contributors to the Open Cluster Management project */
import {
    LOAD_OCP_IMAGES,
    addSnoText,
    architectureData,
    automationControlData,
    clusterPoolDetailsControlData,
    disabledForFirstInGroup,
    getSimplifiedImageName,
    getWorkerName,
    insertToggleModalFunction,
    isHidden_SNO,
    isHidden_lt_OCP48,
    networkingControlData,
    onChangeConnection,
    onChangeSNO,
    onImageChange,
    proxyControlData,
    reverseImageSet,
} from '../../../ManagedClusters/CreateCluster/controlData/ControlDataHelpers'
import { getAlphanumericValidator, getNumericValidator } from '../../../../../../components/TemplateEditor'

import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import Handlebars from 'handlebars'
import installConfigHbs from '../../../ManagedClusters/CreateCluster/templates/install-config.hbs'

const installConfig = Handlebars.compile(installConfigHbs)

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
    'westus3',
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
const govRegions = ['usgovvirginia', 'usgovtexas']

//  List vm sizes in a location/region
//    az vm list-sizes --location eastus --output table
const masterInstanceTypes = (t) => {
    return [
        { value: 'Standard_D2s_v3', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
        { value: 'Standard_D4s_v3', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
        { value: 'Standard_D8s_v3', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
        { value: 'Standard_D16s_v3', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
        { value: 'Standard_D32s_v3', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
        { value: 'Standard_D48s_v3', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
        { value: 'Standard_D64s_v3', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
    ]
}
const ApplicationCreationPage = (t) => {
    return [
        {
            label: t('General Purpose'),
            children: [
                {
                    label: t('Av2-series'),
                    children: [
                        { value: 'Standard_A1_v2', description: t('1 vCPU, 2 GiB - General Purpose') },
                        { value: 'Standard_A2_v2', description: t('2 vCPU, 4 GiB - General Purpose') },
                        { value: 'Standard_A4_v2', description: t('4 vCPU, 8 GiB - General Purpose') },
                        { value: 'Standard_A8_v2', description: t('8 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_A2m_v2', description: t('2 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_A4m_v2', description: t('4 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_A8m_v2', description: t('8 vCPU, 64 GiB - General Purpose') },
                    ],
                },
                {
                    label: t('B-series burstable virtual machine sizes'),
                    children: [
                        { value: 'Standard_B1ls1', description: t('1 vCPU, 0.5 GiB - General Purpose') },
                        { value: 'Standard_B1s', description: t('1 vCPU, 1 GiB - General Purpose') },
                        { value: 'Standard_B1ms  ', description: t('1 vCPU, 2 GiB - General Purpose') },
                        { value: 'Standard_B2s', description: t('2 vCPU, 4 GiB - General Purpose') },
                        { value: 'Standard_B2ms', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                        { value: 'Standard_B4ms', description: t('4 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_B8ms', description: t('8 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_B12ms', description: t('12 vCPU, 48 GiB - General Purpose') },
                        { value: 'Standard_B16ms', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_B20ms', description: t('20 vCPU, 80 GiB - General Purpose') },
                    ],
                },
                {
                    label: t('Dv2-series'),
                    children: [
                        { value: 'Standard_DC1s_v2', description: t('1 vCPU, 4 GiB - General Purpose') },
                        { value: 'Standard_DC2s_v2', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                        { value: 'Standard_DC4s_v2', description: t('4 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_DC8_v2', description: t('8 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_D1_v2', description: t('1 vCPU, 3.5 GiB - General Purpose') },
                        { value: 'Standard_D2_v2', description: t('2 vCPU, 7 GiB - General Purpose') },
                        { value: 'Standard_D3_v2', description: t('4 vCPU, 14 GiB - General Purpose') },
                        { value: 'Standard_D4_v2', description: t('8 vCPU, 28 GiB - General Purpose') },
                        { value: 'Standard_D5_v2', description: t('16 vCPU, 56 GiB - General Purpose') },
                        { value: 'Standard_DS1_v2', description: t('1 vCPU, 3.5 GiB - General Purpose') },
                        { value: 'Standard_DS2_v2', description: t('2 vCPU, 7 GiB - General Purpose') },
                        { value: 'Standard_DS3_v2', description: t('4 vCPU, 14 GiB - General Purpose') },
                        { value: 'Standard_DS4_v2', description: t('8 vCPU, 28 GiB - General Purpose') },
                        { value: 'Standard_DS5_v2', description: t('16 vCPU, 56 GiB - General Purpose') },
                    ],
                },
                {
                    label: t('Dv3-series'),
                    children: [
                        { value: 'Standard_D2_v3', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                        { value: 'Standard_D4_v3', description: t('4 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_D8_v3', description: t('8 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_D16_v3', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_D32_v3', description: t('32 vCPU, 128 GiB - General Purpose') },
                        { value: 'Standard_D48_v3', description: t('48 vCPU, 192 GiB - General Purpose') },
                        { value: 'Standard_D64_v3', description: t('64 vCPU, 256 GiB - General Purpose') },
                        { value: 'Standard_D2s_v3', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                        { value: 'Standard_D4s_v3', description: t('4 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_D8s_v3', description: t('8 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_D16s_v3', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_D32s_v3', description: t('32 vCPU, 128 GiB - General Purpose') },
                        { value: 'Standard_D48s_v3', description: t('48 vCPU, 192 GiB - General Purpose') },
                        { value: 'Standard_D64s_v3', description: t('64 vCPU, 256 GiB - General Purpose') },
                    ],
                },
                {
                    label: t('Dav4-series'),
                    children: [
                        { value: 'Standard_D2a_v4', description: t('8 vCPU, 50 GiB - General Purpose') },
                        { value: 'Standard_D4a_v4', description: t('16 vCPU, 100 GiB - General Purpose') },
                        { value: 'Standard_D8a_v4', description: t('32 vCPU, 200 GiB - General Purpose') },
                        { value: 'Standard_D16a_v4', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_D32a_v4', description: t('32 vCPU, 128 GiB - General Purpose') },
                        { value: 'Standard_D48a_v4', description: t('48 vCPU, 192 GiB - General Purpose') },
                        { value: 'Standard_D64a_v4', description: t('64 vCPU, 256 GiB - General Purpose') },
                        { value: 'Standard_D96a_v4', description: t('96 vCPU, 384 GiB - General Purpose') },
                        { value: 'Standard_D2as_v4', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                        { value: 'Standard_D4as_v4', description: t('4 vCPU, 16 GiB - General Purpose') },
                        { value: 'Standard_D8as_v4', description: t('8 vCPU, 32 GiB - General Purpose') },
                        { value: 'Standard_D16as_v4', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_D32as_v4', description: t('32 vCPU, 128 GiB - General Purpose') },
                        { value: 'Standard_D48as_v4', description: t('48 vCPU, 192 GiB - General Purpose') },
                        { value: 'Standard_D64as_v4', description: t('64 vCPU, 256 GiB - General Purpose') },
                        { value: 'Standard_D96as_v4', description: t('96 vCPU, 384 GiB - General Purpose') },
                        { value: 'Standard_D2d_v42', description: t('8 vCPU, 75 GiB - General Purpose') },
                        { value: 'Standard_D4d_v44', description: t('16 vCPU, 150 GiB - General Purpose') },
                        { value: 'Standard_D8d_v48', description: t('32 vCPU, 300 GiB - General Purpose') },
                        { value: 'Standard_D16d_v4', description: t('16 vCPU, 64 GiB - General Purpose') },
                        { value: 'Standard_D32d_v4', description: t('32 vCPU, 128 GiB - General Purpose') },
                        { value: 'Standard_D48d_v4', description: t('48 vCPU, 192 GiB - General Purpose') },
                        { value: 'Standard_D64d_v4', description: t('64 vCPU, 256 GiB - General Purpose') },
                    ],
                },
            ],
        },
        {
            label: t('Compute Optimized'),
            children: [
                { value: 'Standard_F4s_v2', description: t('4 vCPU, 8 GiB - Compute Optimized') },
                { value: 'Standard_F8s_v2', description: t('8 vCPU, 16 GiB - Compute Optimized') },
                { value: 'Standard_F16s_v2', description: t('16 vCPU, 32 GiB - Compute Optimized') },
                { value: 'Standard_F32s_v2', description: t('32 vCPU, 64 GiB - Compute Optimized') },
                { value: 'Standard_F48s_v2', description: t('48 vCPU, 96 GiB - Compute Optimized') },
                { value: 'Standard_F64s_v2', description: t('64 vCPU, 128 GiB - Compute Optimized') },
                { value: 'Standard_F72s_v21', description: t('72 vCPU, 144 GiB - Compute Optimized') },
            ],
        },
        {
            label: t('Memory Optimized'),
            children: [
                {
                    label: t('Dv2-series'),
                    children: [
                        { value: 'Standard_D11_v2', description: t('2 vCPU, 14 GiB - Memory Optimized') },
                        { value: 'Standard_D12_v2', description: t('4 vCPU, 28 GiB - Memory Optimized') },
                        { value: 'Standard_D13_v2', description: t('8 vCPU, 56 GiB - Memory Optimized') },
                        { value: 'Standard_D14_v2', description: t('16 vCPU, 112 GiB - Memory Optimized') },
                        { value: 'Standard_D15_v2', description: t('1 vCPU, 20 GiB - Memory Optimized') },
                        { value: 'Standard_DS11_v2', description: t('3 vCPU, 2 GiB - Memory Optimized') },
                        { value: 'Standard_DS12_v2', description: t('3 vCPU, 4 GiB - Memory Optimized') },
                        { value: 'Standard_DS13_v2', description: t('3 vCPU, 8 GiB - Memory Optimized') },
                        { value: 'Standard_DS14_v2', description: t('3 vCPU, 16 GiB - Memory Optimized') },
                        { value: 'Standard_DS15_v2', description: t('2 vCPU, 20 GiB - Memory Optimized') },
                    ],
                },
                {
                    label: t('Ev3-series'),
                    children: [
                        { value: 'Standard_E2_v3', description: t('2 vCPU, 16 GiB - Memory Optimized') },
                        { value: 'Standard_E4_v3', description: t('4 vCPU, 32 GiB - Memory Optimized') },
                        { value: 'Standard_E8_v3', description: t('8 vCPU, 64 GiB - Memory Optimized') },
                        { value: 'Standard_E16_v3', description: t('16 vCPU, 128 GiB - Memory Optimized') },
                        { value: 'Standard_E20_v3', description: t('20 vCPU, 160 GiB - Memory Optimized') },
                        { value: 'Standard_E32_v3', description: t('32 vCPU, 256 GiB - Memory Optimized') },
                        { value: 'Standard_E48_v3', description: t('48 vCPU, 384 GiB - Memory Optimized') },
                        { value: 'Standard_E64_v3', description: t('64 vCPU, 432 GiB - Memory Optimized') },
                        { value: 'Standard_E64i_v3', description: t('64 vCPU, 432 GiB - Memory Optimized') },
                        { value: 'Standard_E2s_v3', description: t('16 vCPU, 32 GiB - Memory Optimized') },
                        { value: 'Standard_E4s_v3', description: t('4 vCPU, 32 GiB - Memory Optimized') },
                        { value: 'Standard_E8s_v3', description: t('8 vCPU, 64 GiB - Memory Optimized') },
                        { value: 'Standard_E16s_v3', description: t('16 vCPU, 128 GiB - Memory Optimized') },
                        { value: 'Standard_E20s_v3', description: t('20 vCPU, 160 GiB - Memory Optimized') },
                        { value: 'Standard_E32s_v3', description: t('32 vCPU, 256 GiB - Memory Optimized') },
                        { value: 'Standard_E48s_v3', description: t('48 vCPU, 384 GiB - Memory Optimized') },
                        { value: 'Standard_E64s_v3', description: t('64 vCPU, 432 GiB - Memory Optimized') },
                        { value: 'Standard_E64is_v3', description: t('64 vCPU, 432 GiB - Memory Optimized') },
                    ],
                },
                {
                    label: t('Eav4-series'),
                    children: [
                        { value: 'Standard_E2a_v4', description: t('16 vCPU, 50 GiB - Memory Optimized') },
                        { value: 'Standard_E4a_v4', description: t('32 vCPU, 100 GiB - Memory Optimized') },
                        { value: 'Standard_E8a_v4', description: t('64 vCPU, 200 GiB - Memory Optimized') },
                        { value: 'Standard_E16a_v4', description: t('16 vCPU, 128 GiB - Memory Optimized') },
                        { value: 'Standard_E20a_v4', description: t('20 vCPU, 160 GiB - Memory Optimized') },
                        { value: 'Standard_E32a_v4', description: t('32 vCPU, 256 GiB - Memory Optimized') },
                        { value: 'Standard_E48a_v4', description: t('48 vCPU, 384 GiB - Memory Optimized') },
                        { value: 'Standard_E64a_v4', description: t('64 vCPU, 512 GiB - Memory Optimized') },
                        { value: 'Standard_E96a_v4', description: t('96 vCPU, 672 GiB - Memory Optimized') },
                        { value: 'Standard_E2ds_v4', description: t('2 vCPU, 16 GiB - Memory Optimized') },
                        { value: 'Standard_E4ds_v4', description: t('4 vCPU, 32 GiB - Memory Optimized') },
                        { value: 'Standard_E8ds_v4', description: t('8 vCPU, 64 GiB - Memory Optimized') },
                        { value: 'Standard_E16ds_v4', description: t('16 vCPU, 128 GiB - Memory Optimized') },
                        { value: 'Standard_E20ds_v4', description: t('20 vCPU, 160 GiB - Memory Optimized') },
                        { value: 'Standard_E32ds_v4', description: t('32 vCPU, 256 GiB - Memory Optimized') },
                        { value: 'Standard_E48ds_v4', description: t('48 vCPU, 384 GiB - Memory Optimized') },
                        { value: 'Standard_E64ds_v4', description: t('64 vCPU, 504 GiB - Memory Optimized') },
                    ],
                },
                {
                    label: t('M-series'),
                    children: [
                        { value: 'Standard_M8ms', description: t('8 vCPU, 218.75 GiB - Memory Optimized') },
                        { value: 'Standard_M16ms', description: t('16 vCPU, 437.5 GiB - Memory Optimized') },
                        { value: 'Standard_M32ts', description: t('32 vCPU, 192 GiB - Memory Optimized') },
                        { value: 'Standard_M32ls', description: t('32 vCPU, 256 GiB - Memory Optimized') },
                        { value: 'Standard_M32ms', description: t('32 vCPU, 875 GiB - Memory Optimized') },
                        { value: 'Standard_M64s', description: t('64 vCPU, 1024 GiB - Memory Optimized') },
                        { value: 'Standard_M64ls', description: t('64 vCPU, 512 GiB - Memory Optimized') },
                        { value: 'Standard_M64ms', description: t('64 vCPU, 1792 GiB - Memory Optimized') },
                        { value: 'Standard_M128s', description: t('128 vCPU, 2048 GiB - Memory Optimized') },
                        { value: 'Standard_M128ms', description: t('128 vCPU, 3892 GiB - Memory Optimized') },
                        { value: 'Standard_M64', description: t('64 vCPU, 1024 GiB - Memory Optimized') },
                        { value: 'Standard_M64m', description: t('64 vCPU, 1792 GiB - Memory Optimized') },
                        { value: 'Standard_M128', description: t('128 vCPU, 2048 GiB - Memory Optimized') },
                        { value: 'Standard_M128m', description: t('128 vCPU, 3892 GiB - Memory Optimized') },
                    ],
                },
                {
                    label: t('Mv2-series'),
                    children: [
                        { value: 'Standard_M208ms_v21', description: t('208 vCPU, 5700 GiB - Memory Optimized') },
                        { value: 'Standard_M208s_v21', description: t('208 vCPU, 2850 GiB - Memory Optimized') },
                        { value: 'Standard_M416ms_v21', description: t('416 vCPU, 11400 GiB - Memory Optimized') },
                        { value: 'Standard_M416s_v21', description: t('416 vCPU, 5700 GiB - Memory Optimized') },
                    ],
                },
            ],
        },
        {
            label: t('Storage Optimized'),
            children: [
                { value: 'Standard_L8s_v2', description: t('64 vCPU, 80 GiB - Storage Optimized') },
                { value: 'Standard_L16s_v2', description: t('16 vCPU, 128 GiB - Storage Optimized') },
                { value: 'Standard_L32s_v2', description: t('32 vCPU, 256 GiB - Storage Optimized') },
                { value: 'Standard_L48s_v2', description: t('48 vCPU, 384 GiB - Storage Optimized') },
                { value: 'Standard_L64s_v2', description: t('64 vCPU, 512 GiB - Storage Optimized') },
                { value: 'Standard_L80s_v26', description: t('80 vCPU, 640 GiB - Storage Optimized') },
            ],
        },
        {
            label: t('GPU Accelerated Compute'),
            children: [
                {
                    label: t('NC-series'),
                    children: [
                        {
                            value: 'Standard_NC6',
                            description: t('6 vCPU, 56 GiB, 12 GPUs, 24 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC12',
                            description: t('12 vCPU, 112 GiB, 24 GPUs, 48 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24',
                            description: t('24 vCPU, 224 GiB, 4 GPUs, 48 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24r',
                            description: t('24 vCPU, 224 GiB, 4 GPUs, 48 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC6s_v2',
                            description: t('6 vCPU, 112 GiB, 16 GPUs, 12 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC12s_v2',
                            description: t('12 vCPU, 224 GiB, 2 GPUs, 32 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24s_v2',
                            description: t('24 vCPU, 448 GiB, 4 GPUs, 64 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24rs_v2',
                            description: t('24 vCPU, 448 GiB, GPUs, GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC6s_v3',
                            description: t('6 vCPU, 112 GiB, 16 GPUs, 12 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC12s_v3',
                            description: t('12 vCPU, 224 GiB, 2 GPUs, 32 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24s_v3',
                            description: t('24 vCPU, 448 GiB, 4 GPUs, 64 GPU GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NC24rs_v3',
                            description: t('24 vCPU, 448 GiB, GPUs, GPU GiB - GPU Accelerated Compute'),
                        },
                    ],
                },
                {
                    label: t('ND-series'),
                    children: [
                        {
                            value: 'Standard_ND6s',
                            description: t('6 vCPU, 112 GiB, GPUs,24 GPU 12GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_ND12s',
                            description: t('12 vCPU, 224 GiB, GPUs,48 GPU 24GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_ND24s',
                            description: t('24 vCPU, 448 GiB, GPUs,96 GPU 32GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_ND24rs',
                            description: t('24 vCPU, 448 GiB, GPUs, GPU GiB - GPU Accelerated Compute'),
                        },
                    ],
                },
                {
                    label: t('NV-series'),
                    children: [
                        {
                            value: 'Standard_NV6',
                            description: t('6 vCPU, 56 GiB, GPUs, 8 GPU 24GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV12',
                            description: t('12 vCPU, 112 GiB, GPUs,16 GPU 48GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV24',
                            description: t('24 vCPU, 224 GiB, GPUs,4 GPU 32GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV12s_v3',
                            description: t('12 vCPU, 112 GiB, GPUs,8 GPU 12GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV24s_v3',
                            description: t('24 vCPU, 224 GiB, GPUs,16 GPU 24GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV48s_v3',
                            description: t('48 vCPU, 448 GiB, GPUs,4 GPU 32GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV4as_v4',
                            description: t('4 vCPU, 14 GiB, GPUs,2 GPU 4 GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV8as_v4',
                            description: t('8 vCPU, 28 GiB, GPUs,4  GPU 8 GiB - GPU Accelerated Compute'),
                        },
                        {
                            value: 'Standard_NV16as_v4',
                            description: t('16 vCPU, 56 GiB, GPUs,8  GPU 16 GiB - GPU Accelerated Compute'),
                        },
                    ],
                },
            ],
        },
        {
            label: t('High Performance Compute'),
            children: [
                { value: 'Standard_H8', description: t('8 vCPU, 56 GiB RAM - High Performance Compute') },
                { value: 'Standard_H16', description: t('16 vCPU, 112 GiB RAM - High Performance Compute') },
                { value: 'Standard_H8m', description: t('8 vCPU, 112 GiB RAM - High Performance Compute') },
                { value: 'Standard_H16m', description: t('16 vCPU, 224 GiB RAM - High Performance Compute') },
                { value: 'Standard_H16r', description: t('16 vCPU, 112 GiB RAM - High Performance Compute') },
                { value: 'Standard_H16mr', description: t('16 vCPU, 224 GiB RAM - High Performance Compute') },
            ],
        },
    ]
}

const setRegions = (control, controlData) => {
    const alterRegionData = (controlData, regions, active) => {
        const regionObject = controlData.find((object) => object.name === 'Region')
        regionObject.active = active
        regionObject.available = regions
    }

    if (control.active) {
        const connection = control.availableMap[control.active]
        if (connection && connection.replacements.cloudName === 'AzureUSGovernmentCloud')
            alterRegionData(controlData, govRegions, govRegions[0])
        else alterRegionData(controlData, regions, 'centralus')
    } else {
        alterRegionData(controlData, regions, 'centralus')
    }

    onChangeConnection(control, controlData)
}

export const getControlDataAZR = (t, handleModalToggle, includeAutomation = true, includeSno = false) => {
    const controlData = [
        ///////////////////////  connection  /////////////////////////////////////
        {
            id: 'detailStep',
            type: 'step',
            title: t('Cluster details'),
        },
        {
            id: 'infrastructure',
            name: t('Infrastructure'),
            active: 'Azure',
            type: 'reviewinfo',
        },
        {
            name: t('creation.ocp.cloud.connection'),
            tooltip: t('tooltip.creation.ocp.cloud.connection'),
            id: 'connection',
            type: 'singleselect',
            onSelect: setRegions,
            placeholder: t('creation.ocp.cloud.select.connection'),
            providerId: 'azr',
            validation: {
                notification: t('creation.ocp.cluster.must.select.connection'),
                required: true,
            },
            available: [],
            footer: <CreateCredentialModal />,
        },
        ...clusterPoolDetailsControlData(t),
        ///////////////////////  imageset  /////////////////////////////////////
        {
            name: t('cluster.create.ocp.image'),
            tooltip: t('tooltip.cluster.create.ocp.image'),
            id: 'imageSet',
            type: 'combobox',
            simplified: getSimplifiedImageName,
            placeholder: t('creation.ocp.cloud.select.ocp.image'),
            fetchAvailable: LOAD_OCP_IMAGES('azr', t),
            validation: {
                notification: t('creation.ocp.cluster.must.select.ocp.image'),
                required: true,
            },
            onSelect: onImageChange,
            reverse: reverseImageSet,
        },
        //Always Hidden
        {
            id: 'singleNodeFeatureFlag',
            type: 'checkbox',
            active: false,
            hidden: true,
        },
        {
            name: t('cluster.create.ocp.singleNode'),
            tooltip: t('tooltip.cluster.create.ocp.singleNode'),
            id: 'singleNode',
            type: 'checkbox',
            active: false,
            hidden: isHidden_lt_OCP48,
            onSelect: onChangeSNO,
            icon: <DevPreviewLabel />,
        },
        {
            name: t('creation.ocp.addition.labels'),
            id: 'additional',
            type: 'labels',
            active: [],
            tip: t(
                'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.'
            ),
        },
        {
            id: 'infrastructure',
            active: ['Azure'],
            type: 'hidden',
            hasReplacements: true,
            availableMap: {
                Azure: {
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
            title: t('Node pools'),
        },
        {
            id: 'nodes',
            type: 'title',
            info: t('creation.ocp.cluster.node.pool.info'),
        },
        ///////////////////////  region  /////////////////////////////////////
        {
            name: t('creation.ocp.region'),
            tooltip: t('tooltip.creation.ocp.azr.region'),
            id: 'region',
            type: 'combobox',
            active: 'centralus',
            available: regions,
            validation: getAlphanumericValidator(t),
            cacheUserValueKey: 'create.cluster.region',
            reverse: 'ClusterDeployment[0].metadata.labels.region',
        },
        ///////////////////////  architecture  /////////////////////////////////////
        ...architectureData(t),
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
                    subtitle: t('creation.ocp.node.controlplane.pool.title'),
                    info: t('creation.ocp.node.controlplane.pool.info'),
                },
                ///////////////////////  instance type  /////////////////////////////////////
                {
                    name: t('creation.ocp.instance.type'),
                    tooltip: t('tooltip.creation.ocp.azr.instance.type'),
                    learnMore: 'https://docs.microsoft.com/en-us/azure/virtual-machines/sizes-general',
                    id: 'masterType',
                    type: 'combobox',
                    available: masterInstanceTypes(t),
                    active: 'Standard_D4s_v3',
                    validation: {
                        constraint: '[A-Za-z0-9_]+',
                        notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
                        required: false,
                    },
                    cacheUserValueKey: 'create.cluster.master.type',
                },
                ///////////////////////  root volume  /////////////////////////////////////
                {
                    name: t('creation.ocp.root.storage'),
                    tooltip: t('tooltip.creation.ocp.azr.root.storage'),
                    id: 'masterRootStorage',
                    type: 'combobox',
                    active: '128',
                    available: ['128', '256', '512', '1024', '2048'],
                    validation: getNumericValidator(t),
                    cacheUserValueKey: 'create.cluster.master.root.storage',
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
                addPrompt: t('creation.ocp.cluster.add.node.pool'),
                deletePrompt: t('creation.ocp.cluster.delete.node.pool'),
                disableDeleteForFirst: true,
            },
            controlData: [
                {
                    id: 'workerPool',
                    type: 'section',
                    collapsable: true,
                    collapsed: true,
                    subtitle: getWorkerName,
                    info: t('creation.ocp.node.worker.pool.info'),
                },
                ///////////////////////  pool name  /////////////////////////////////////
                {
                    name: t('creation.ocp.pool.name'),
                    tooltip: t('tooltip.creation.ocp.pool.name'),
                    placeholder: t('creation.ocp.pool.placeholder'),
                    id: 'workerName',
                    type: 'text',
                    active: 'worker',
                    validation: {
                        constraint: '[A-Za-z0-9-_]+',
                        notification: t('creation.ocp.cluster.valid.alphanumeric'),
                        required: true,
                    },
                    disabled: disabledForFirstInGroup,
                },
                ///////////////////////  zone  /////////////////////////////////////
                {
                    name: t('creation.ocp.zones'),
                    tooltip: t('tooltip.creation.ocp.worker.zones'),
                    id: 'workerZones',
                    type: 'multiselect',
                    active: ['1', '2', '3'],
                    available: ['1', '2', '3'],
                    cacheUserValueKey: 'create.cluster.aws.worker.zones',
                    validation: getAlphanumericValidator(t),
                    multiselect: true,
                },
                ///////////////////////  instance type  /////////////////////////////////////
                {
                    name: t('creation.ocp.instance.type'),
                    tooltip: t('tooltip.creation.ocp.azr.instance.type'),
                    learnMore: 'https://docs.microsoft.com/en-us/azure/virtual-machines/sizes-general',
                    id: 'workerType',
                    type: 'treeselect',
                    available: ApplicationCreationPage(t),
                    active: 'Standard_D2s_v3',
                    validation: {
                        constraint: '[A-Za-z0-9_]+',
                        notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
                        required: false,
                    },
                    cacheUserValueKey: 'create.cluster.worker.type',
                },
                ///////////////////////  compute node count  /////////////////////////////////////
                {
                    name: t('creation.ocp.compute.node.count'),
                    tooltip: t('tooltip.creation.ocp.compute.node.count'),
                    id: 'computeNodeCount',
                    type: 'number',
                    initial: '3',
                    validation: getNumericValidator(t),
                    cacheUserValueKey: 'create.cluster.compute.node.count',
                },
                ///////////////////////  storage  /////////////////////////////////////
                {
                    name: t('creation.ocp.root.storage'),
                    tooltip: t('tooltip.creation.ocp.azr.root.storage'),
                    id: 'workerStorage',
                    type: 'combobox',
                    active: '128',
                    available: ['128', '256', '512', '1024', '2048'],
                    validation: getNumericValidator(t),
                    cacheUserValueKey: 'create.cluster.persistent.storage',
                },
            ],
        },
        {
            id: 'networkStep',
            type: 'step',
            title: t('Networking'),
        },
        ...networkingControlData(t),
        ...proxyControlData(t),
    ]
    if (includeSno) {
        addSnoText(controlData, t)
    }
    if (includeAutomation) {
        return [...controlData, ...automationControlData(t)]
    }
    if (handleModalToggle) {
        insertToggleModalFunction(handleModalToggle, controlData)
    }
    return controlData
}

export default getControlDataAZR
