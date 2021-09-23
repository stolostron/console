/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { VALIDATE_NUMERIC, VALIDATE_IP, VALIDATE_IP_OPTIONAL, VALIDATE_URL } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    clusterDetailsControlData,
    networkingControlData,
    proxyControlData,
    automationControlData,
    getSimplifiedImageName,
    getWorkerName,
    isHidden_lt_OCP48,
    isHidden_SNO,
    onChangeSNO,
    onChangeConnection,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'

export const getControlDataOST = (includeAutomation = true) => {
    if (includeAutomation) return [...controlDataOST, ...automationControlData]
    return [...controlDataOST]
}

const onChangeDisconnect = (control, controlData) => {
    const infrastructure = controlData.find(({ id }) => {
        return id === 'connection'
    })
    const { active, availableMap = {} } = infrastructure
    const replacements = _.get(availableMap[active], 'replacements')
    const isDisconnected = controlData.find(({ id }) => {
        return id === 'isDisconnected'
    }).active
    ;['clusterOSImage', 'pullSecret', 'imageContentSources', 'disconnectedAdditionalTrustBundle'].forEach((pid) => {
        const ctrl = controlData.find(({ id }) => id === pid)
        if (ctrl) {
            ctrl.disabled = !isDisconnected
            if (ctrl.disabled) {
                ctrl.saveActive = ctrl.active
                ctrl.active = undefined
                if (replacements) {
                    delete replacements[ctrl.id]
                }
            } else {
                ctrl.active = ctrl.saveActive
                if (replacements) {
                    replacements[ctrl.id] = ctrl.saveActive
                }
            }
        }
    })
}

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
        onSelect: onChangeConnection,
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
                collapsed: true,
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
        id: 'clusterOSImage',
        type: 'text',
        name: 'Cluster OS Image',
        disabled: true,
        tip: 'The location of the Red Hat Enterprise Linux CoreOS (RHCOS) image in your local registry.',
        validation: VALIDATE_URL,
    },
    {
        id: 'pullSecret',
        type: 'textarea',
        name: 'Pull Secret',
        disabled: true,
        tip: 'Secret required to pull the OS image from your local registry.',
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

export default getControlDataOST
