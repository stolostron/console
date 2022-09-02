/* Copyright Contributors to the Open Cluster Management project */

import { VALIDATE_NUMERIC, VALIDATE_IP } from '../../../../../../components/TemplateEditor'
import {
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
    architectureData,
    appendKlusterletAddonConfig,
    insertToggleModalFunction,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import installConfigHbs from '../templates/install-config.hbs'
import Handlebars from 'handlebars'
import { ModalWithWizard } from '../components/CreateCredentialModal'

const installConfig = Handlebars.compile(installConfigHbs)

export const getControlDataVMW = (
    includeAutomation = true,
    includeSno = false,
    includeKlusterletAddonConfig = true,
    handleModalToggle
) => {
    if (includeSno) addSnoText(controlDataVMW)
    appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlDataVMW)
    insertToggleModalFunction(handleModalToggle, controlDataVMW)
    if (includeAutomation) return [...controlDataVMW, ...automationControlData]
    return [...controlDataVMW]
}

const controlDataVMW = [
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
        active: 'vSphere',
        type: 'reviewinfo',
    },
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
        onSelect: onChangeConnection,
        encode: ['cacertificate'],
        footer: <ModalWithWizard />,
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
        id: 'additional',
        type: 'labels',
        active: [],
        tip: 'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.',
    },
    {
        id: 'infrastructure',
        active: ['vSphere'],
        type: 'hidden',
        hasReplacements: true,
        availableMap: {
            vSphere: {
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
        placeholder: 'creation.ocp.cluster.vmw.network.type',
        type: 'text',
        active: '',
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

export default getControlDataVMW
