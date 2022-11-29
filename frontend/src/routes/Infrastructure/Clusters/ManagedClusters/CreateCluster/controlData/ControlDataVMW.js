/* Copyright Contributors to the Open Cluster Management project */

import { VALIDATE_NUMERIC, VALIDATE_IP } from '../../../../../../components/TemplateEditor'
import {
    LOAD_OCP_IMAGES,
    getSimplifiedImageName,
    useProxyControlData,
    useAutomationControlData,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
    onChangeConnection,
    onChangeDisconnect,
    addSnoText,
    useArchitectureData,
    appendKlusterletAddonConfig,
    insertToggleModalFunction,
    onImageChange,
    useClusterDetailsControlData,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import installConfigHbs from '../templates/install-config.hbs'
import Handlebars from 'handlebars'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useMemo } from 'react'

const installConfig = Handlebars.compile(installConfigHbs)

export const useControlDataVMW = (
    handleModalToggle,
    includeAutomation = true,
    includeSno = false,
    includeKlusterletAddonConfig = true
) => {
    const clusterDetailsControlData = useClusterDetailsControlData()
    const automationControlData = useAutomationControlData()
    const proxyControlData = useProxyControlData()
    const architectureData = useArchitectureData()

    const { t } = useTranslation()
    return useMemo(() => {
        const controlData = [
            ////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////  connection  /////////////////////////////////////
            {
                id: 'detailStep',
                type: 'step',
                title: t('Cluster details'),
            },
            {
                id: 'infrastructure',
                name: t('Infrastructure'),
                active: 'vSphere',
                type: 'reviewinfo',
            },
            {
                name: t('creation.ocp.cloud.connection'),
                tooltip: t('tooltip.creation.ocp.cloud.connection'),
                id: 'connection',
                type: 'singleselect',
                placeholder: t('creation.ocp.cloud.select.connection'),
                providerId: 'vmw',
                validation: {
                    notification: t('creation.ocp.cluster.must.select.connection'),
                    required: true,
                },
                available: [],
                onSelect: onChangeConnection,
                encode: ['cacertificate'],
                footer: <CreateCredentialModal />,
            },
            ...clusterDetailsControlData,
            ////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////  imageset  /////////////////////////////////////
            {
                name: t('cluster.create.ocp.image'),
                tooltip: t('tooltip.cluster.create.ocp.image.vmw'),
                id: 'imageSet',
                type: 'combobox',
                simplified: getSimplifiedImageName,
                placeholder: t('creation.ocp.cloud.select.ocp.image'),
                fetchAvailable: LOAD_OCP_IMAGES('vmw'),
                validation: {
                    notification: t('creation.ocp.cluster.must.select.ocp.image'),
                    required: true,
                },
                onSelect: onImageChange,
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
                title: t('Node pools'),
            },
            {
                id: 'nodes',
                type: 'title',
                info: t('creation.ocp.cluster.node.pool.info'),
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
                        subtitle: t('creation.ocp.node.controlplane.pool.title'),
                        info: t('creation.ocp.node.controlplane.pool.info'),
                    },
                    ///////////////////////  coresPerSocket  /////////////////////////////////////
                    {
                        name: t('creation.ocp.cores.per.socket'),
                        tooltip: t('tooltip.creation.ocp.cores.per.socket'),
                        id: 'masterCoresPerSocket',
                        type: 'number',
                        initial: '2',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  cpus  /////////////////////////////////////
                    {
                        name: t('creation.ocp.cpus'),
                        tooltip: t('tooltip.creation.ocp.cpus'),
                        id: 'masterCpus',
                        type: 'number',
                        initial: '4',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  memoryMB  /////////////////////////////////////
                    {
                        name: t('creation.ocp.memoryMB'),
                        tooltip: t('tooltip.creation.ocp.memoryMB'),
                        id: 'masterMemoryMB',
                        type: 'number',
                        initial: '16384',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  root volume  /////////////////////////////////////
                    {
                        name: t('creation.ocp.diskSizeGB'),
                        tooltip: t('tooltip.creation.ocp.diskSizeGB'),
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
                    addPrompt: t('creation.ocp.cluster.add.node.pool'),
                    deletePrompt: t('creation.ocp.cluster.delete.node.pool'),
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
                    },
                    ///////////////////////  coresPerSocket  /////////////////////////////////////
                    {
                        name: t('creation.ocp.cores.per.socket'),
                        tooltip: t('tooltip.creation.ocp.cores.per.socket'),
                        id: 'coresPerSocket',
                        type: 'number',
                        initial: '2',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  cpus  /////////////////////////////////////
                    {
                        name: t('creation.ocp.cpus'),
                        tooltip: t('tooltip.creation.ocp.cpus'),
                        id: 'cpus',
                        type: 'number',
                        initial: '4',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  memoryMB  /////////////////////////////////////
                    {
                        name: t('creation.ocp.memoryMB'),
                        tooltip: t('tooltip.creation.ocp.memoryMB'),
                        id: 'memoryMB',
                        type: 'number',
                        initial: '16384',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  diskSizeGB  /////////////////////////////////////
                    {
                        name: t('creation.ocp.diskSizeGB'),
                        tooltip: t('tooltip.creation.ocp.diskSizeGB'),
                        id: 'diskSizeGB',
                        type: 'number',
                        initial: '120',
                        validation: VALIDATE_NUMERIC,
                    },
                    ///////////////////////  compute node count  /////////////////////////////////////
                    {
                        name: t('creation.ocp.compute.node.count'),
                        tooltip: t('tooltip.creation.ocp.compute.node.count'),
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
                title: t('Networking'),
            },
            {
                id: 'networkType',
                name: t('creation.ocp.cluster.vmw.network.type'),
                tooltip: t('tooltip.creation.ocp.cluster.vmw.network.type'),
                placeholder: t('creation.ocp.cluster.vmw.network.type'),
                type: 'text',
                active: '',
            },
            {
                id: 'apiVIP',
                type: 'text',
                name: t('creation.ocp.api.vip'),
                tooltip: t('tooltip.creation.ocp.api.vip'),
                placeholder: t('creation.ocp.api.vip.placeholder'),
                active: '',
                validation: VALIDATE_IP,
            },
            {
                id: 'ingressVIP',
                type: 'text',
                name: t('creation.ocp.ingress.vip'),
                tooltip: t('tooltip.creation.ocp.ingress.vip'),
                placeholder: t('creation.ocp.ingress.vip.placeholder'),
                active: '',
                validation: VALIDATE_IP,
            },
            ...proxyControlData,
            ///////////////////////  openstack  /////////////////////////////////////
            {
                id: 'disconnectedStep',
                type: 'step',
                title: t('Disconnected installation'),
            },
            {
                id: 'disconnectedInfo',
                type: 'title',
                info: t(
                    'Restricted networks which do not have direct access to the Internet require a mirror location of the Red Hat Enterprise Linux CoreOS image.'
                ),
            },
            {
                name: t('Create disconnected installation'),
                id: 'isDisconnected',
                type: 'checkbox',
                active: false,
                onSelect: onChangeDisconnect,
            },
            {
                id: 'imageContentSources',
                type: 'textarea',
                name: t('Image Content Sources'),
                disabled: true,
                tip: t('The imageContentSources values that were generated during mirror registry creation.'),
            },
            {
                id: 'disconnectedAdditionalTrustBundle',
                type: 'textarea',
                name: t('Additional trust bundle'),
                disabled: true,
                placeholder: t('-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----'),
                tip: t(
                    'The contents of the certificate file that you used for your mirror registry, which can be an existing, trusted certificate authority or the self-signed certificate that you generated for the mirror registry.'
                ),
            },
        ]
        if (includeSno) {
            addSnoText(controlData, t)
        }
        appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
        insertToggleModalFunction(handleModalToggle, controlData)
        if (includeAutomation) {
            return [...controlData, ...automationControlData]
        }
        return controlData
    }, [
        t,
        handleModalToggle,
        includeAutomation,
        includeSno,
        includeKlusterletAddonConfig,
        clusterDetailsControlData,
        automationControlData,
        proxyControlData,
        architectureData,
    ])
}

export default useControlDataVMW
