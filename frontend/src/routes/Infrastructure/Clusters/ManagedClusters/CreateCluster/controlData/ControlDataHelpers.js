/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line no-use-before-define
import React from 'react'
import {
    VALIDATE_CIDR,
    VALIDATE_NUMERIC,
    VALIDATE_BASE_DNS_NAME_REQUIRED,
    VALID_DNS_LABEL,
    VALIDATE_URL,
} from 'temptifly'
import { listClusterImageSets } from '../../../../../../resources'
import { unpackProviderConnection } from '../../../../../../resources'
import { NavigationPath } from '../../../../../../NavigationPath'
import _ from 'lodash'

const OpenNewTab = () => (
    <svg width="24px" height="24px" x="0px" y="0px" viewBox="0 0 1024 1024" xmlSpace="preserve" role="presentation">
        <g stroke="none" strokeWidth="1" fillRule="evenodd">
            <path d="M576,320 L896,320 L896,192 L576,192 L576,320 Z M128,320 L448,320 L448,192 L128,192 L128,320 Z M930,64 L896,64 L128,64 L94,64 C42.085,64 0,106.085 0,158 L0,192 L0,832 L0,866 C0,917.915 42.085,960 94,960 L128,960 L488,960 C501.255,960 512,949.255 512,936 L512,856 C512,842.745 501.255,832 488,832 L140,832 C133.373,832 128,826.627 128,820 L128,448 L896,448 L896,552 C896,565.255 906.745,576 920,576 L1000,576 C1013.255,576 1024,565.255 1024,552 L1024,158 C1024,106.085 981.915,64 930,64 L930,64 Z" />
            <path d="M968,784 L848,784 L848,664 C848,650.7 837.3,640 824,640 L776,640 C762.7,640 752,650.7 752,664 L752,784 L632,784 C618.7,784 608,794.7 608,808 L608,856 C608,869.3 618.7,880 632,880 L752,880 L752,1000 C752,1013.3 762.7,1024 776,1024 L824,1024 C837.3,1024 848,1013.3 848,1000 L848,880 L968,880 C981.3,880 992,869.3 992,856 L992,808 C992,794.7 981.3,784 968,784" />
        </g>
    </svg>
)

export const CREATE_CLOUD_CONNECTION = {
    prompt: 'creation.ocp.cloud.add.connection',
    type: 'link',
    url: NavigationPath.addCredentials,
    positionBottomRight: true,
    id: 'add-provider-connection',
    icon: <OpenNewTab />,
}

export const CREATE_AUTOMATION_TEMPLATE = {
    prompt: 'creation.ocp.cloud.add.template',
    type: 'link',
    url: NavigationPath.addAnsibleAutomation,
    positionBottomRight: true,
    id: 'add-automation-template',
    icon: <OpenNewTab />,
}
export const LOAD_OCP_IMAGES = (provider) => {
    return {
        query: () => {
            return listClusterImageSets().promise
        },
        emptyDesc: 'creation.ocp.cloud.no.ocp.images',
        loadingDesc: 'creation.ocp.cloud.loading.ocp.images',
        setAvailable: setAvailableOCPImages.bind(null, provider),
        setAvailableMap: setAvailableOCPMap.bind(null),
    }
}

const getImageName = (image) => {
    return `img${image
        .split(':')
        .pop()
        .replace(/[^\w.]|_/g, '-')}`
}

const getImageVersion = (image) => {
    const match = /(\d+.\d+.\d+)-/gm.exec(image)
    return _.get(match, '1', '')
}

export const getSimplifiedImageName = (image) => {
    const match = /.+:(.*)-/gm.exec(image)
    if (match && match[1]) {
        return `OpenShift ${match[1]}`
    }
}

export const numberedControlNameFunction = (key) => (control, controlData, i18n) => {
    const { grpNum } = control
    return i18n(key, [grpNum + 1])
}

export const getWorkerName = numberedControlNameFunction('creation.ocp.node.worker.pool.title')

export const setAvailableOCPImages = (provider, control, result) => {
    const { loading } = result
    const { data } = result
    const imageSets = data
    control.isLoading = false
    const error = imageSets ? null : result.error
    if (!control.available) {
        control.available = []
        control.availableMap = {}
    }
    if (control.available.length === 0 && (error || imageSets)) {
        if (error) {
            control.hasReplacements = true
            control.noHandlebarReplacements = true
            control.isFailed = true
        } else if (imageSets) {
            control.isLoaded = true
            control.hasReplacements = true
            control.noHandlebarReplacements = true
            imageSets.forEach((item) => {
                const { metadata, spec } = item
                const name = metadata?.name
                const visible = metadata?.labels?.visible
                const releaseImage = spec?.releaseImage
                // We only hide when visible is false. We consider visible the default
                if (visible !== 'false') {
                    switch (provider) {
                        case 'bmc':
                            if (name.includes('img4.3')) {
                                return
                            }
                            break
                        case 'vmw':
                            if (name.includes('img4.3') || name.includes('img4.4')) {
                                return
                            }
                            break
                        default:
                            break
                    }
                    control.available.push(releaseImage)
                    control.availableMap[releaseImage] = {
                        replacements: {
                            releaseImageReference: name,
                            clusterImageSetComment: releaseImage,
                            releaseImageVersion: getImageVersion(name),
                        },
                    }
                }
            })
            control.available.reverse()
        }
    } else {
        control.isLoading = loading
    }
}

export const setAvailableOCPMap = (control) => {
    const { active, availableMap, isFailed } = control
    if (active && !availableMap[active]) {
        availableMap[active] = !isFailed
            ? {
                  replacements: {
                      clusterReleaseImage: active,
                      clusterImageSetName: getImageName(active),
                      releaseImageVersion: getImageVersion(active),
                  },
              }
            : {
                  replacements: {
                      releaseImage: active,
                  },
              }
    }
}

export const setAvailableConnections = (control, secrets) => {
    const connections = secrets.filter(
        (secret) => secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === control.providerId
    )
    control.availableMap = {}
    connections?.forEach?.((c) => {
        const unpackedSecret = unpackProviderConnection(c)
        const replacements = { ...(unpackedSecret.stringData ?? {}) }
        if (replacements['sshKnownHosts']) {
            replacements['sshKnownHosts'] = replacements['sshKnownHosts'].split('\n')
        }
        // handlebars don't like periods in ids, so use a substitute tag - OpenStack
        if (replacements['clouds.yaml']) {
            replacements['cloudsYaml'] = replacements['clouds.yaml']
        }
        // handlebars don't like periods in ids, so use a substitute tag - Azure
        if (replacements['osServicePrincipal.json']) {
            replacements['osServicePrincipalJson'] = replacements['osServicePrincipal.json']
        }
        // handlebars don't like periods in ids, so use a substitute tag - GCP
        if (replacements['osServiceAccount.json']) {
            replacements['osServiceAccountJson'] = replacements['osServiceAccount.json']
        }
        // RHV
        if (replacements['ovirt_ca_bundle']) {
            replacements['ovirtCaBundle'] = replacements['ovirt_ca_bundle']
        }
        control.availableMap[c.metadata.name] = { replacements }
        control.hasReplacements = true
        control.noHandlebarReplacements = true
        control.isLoaded = true
    })
    control.available = connections.map((secret) => secret.metadata.name)
}

export const setAvailableTemplates = (control, templates) => {
    control.available = templates.map((template) => template.metadata.name)
}

const onChangeProxy = (control, controlData) => {
    const infrastructure = controlData.find(({ id }) => {
        return id === 'connection'
    })
    const { active, availableMap = {} } = infrastructure
    const replacements = _.get(availableMap[active], 'replacements')
    const useProxy = controlData.find(({ id }) => {
        return id === 'hasProxy'
    }).active
    ;['httpProxy', 'httpsProxy', 'noProxy', 'additionalTrustBundle'].forEach((pid) => {
        const ctrl = controlData.find(({ id }) => id === pid)
        if (ctrl) {
            ctrl.disabled = !useProxy
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

export const onChangeConnection = (control, controlData) => {
    const { active, availableMap = {} } = control
    const replacements = _.get(availableMap[active], 'replacements')
    if (replacements) {
        controlData.forEach((control) => {
            switch (control.id) {
                case 'hasProxy':
                    control.active = !!replacements['httpProxy']
                    break
                case 'isDisconnected':
                    control.active = !!replacements['imageContentSources']
                    break
                default:
                    if (replacements[control.id]) {
                        switch (control.type) {
                            case 'values':
                                control.active = replacements[control.id].split(',')
                                break
                            default:
                                control.active = replacements[control.id]
                                break
                        }
                        control.disabled = false
                        if (control.id === 'disconnectedAdditionalTrustBundle') {
                        }
                    }
                    break
            }
        })
    }
    setTimeout(() => {
        const control = controlData.find(({ id }) => {
            return id === 'disconnectedAdditionalTrustBundle'
        })
        if (control) {
            control.active = replacements['additionalTrustBundle']
            control.disabled = !control.active
        }
    })
}

export const onChangeDisconnect = (control, controlData) => {
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
export function getOSTNetworkingControlData() {
    // Kuryr should only be available for Openstack
    const networkData = _.cloneDeep(networkingControlData)
    const modifiedData = networkData.find((object) => object.id == 'networkType')
    modifiedData.available.push('Kuryr')
    return networkData
}

export const clusterDetailsControlData = [
    {
        id: 'detailStep',
        type: 'step',
        title: 'Cluster details',
    },
    {
        name: 'creation.ocp.name',
        tooltip: 'tooltip.creation.ocp.name',
        placeholder: 'creation.ocp.name.placeholder',
        id: 'name',
        type: 'text',
        validation: {
            constraint: VALID_DNS_LABEL,
            notification: 'import.form.invalid.dns.label',
            required: true,
        },
        reverse: 'ClusterDeployment[0].metadata.name',
    },
    {
        name: 'creation.ocp.clusterSet',
        tooltip: 'tooltip.creation.ocp.clusterSet',
        id: 'clusterSet',
        type: 'singleselect',
        placeholder: 'placeholder.creation.ocp.clusterSet',
        validation: {
            required: false,
        },
        available: [],
    },
    {
        name: 'creation.ocp.baseDomain',
        tooltip: 'tooltip.creation.ocp.baseDomain',
        placeholder: 'placeholder.creation.ocp.baseDomain',
        id: 'baseDomain',
        type: 'text',
        validation: VALIDATE_BASE_DNS_NAME_REQUIRED,
        tip: 'All DNS records must be subdomains of this base and include the cluster name. This cannot be changed after cluster installation.',
    },
    {
        name: 'cluster.create.ocp.fips',
        id: 'fips',
        type: 'checkbox',
        active: false,
        tip: 'Use the Federal Information Processing Standards (FIPS) modules provided with RHCOS instead of the default Kubernetes cryptography suite.',
    },
]

export const networkingControlData = [
    ///////////////////////  networking  /////////////////////////////////////
    {
        id: 'networkInfo',
        type: 'title',
        info: 'Configure network access for your cluster. One network is created by default.',
    },
    {
        id: 'networkType',
        name: 'creation.ocp.cluster.network.type',
        tooltip: 'tooltip.creation.ocp.cluster.network.type',
        type: 'singleselect',
        active: 'OpenShiftSDN',
        available: ['OpenShiftSDN', 'OVNKubernetes'],
        validation: {
            notification: 'creation.ocp.cluster.valid.key',
            required: true,
        },
    },
    {
        id: 'networks',
        type: 'group',
        prompts: {
            addPrompt: 'creation.ocp.cluster.add.network',
            deletePrompt: 'creation.ocp.cluster.delete.node.pool',
        },
        controlData: [
            {
                id: 'networkGroup',
                type: 'section',
                collapsable: true,
                subtitle: numberedControlNameFunction('creation.ocp.node.network.title'),
                info: 'creation.ocp.node.network.info',
            },
            {
                id: 'clusterNetwork',
                type: 'text',
                name: 'creation.ocp.cluster.network',
                tooltip: 'tooltip.creation.ocp.cluster.network',
                placeholder: 'creation.ocp.cluster.network.placeholder',
                active: '10.128.0.0/14',
                validation: VALIDATE_CIDR,
            },
            {
                id: 'hostPrefix',
                type: 'text',
                name: 'creation.ocp.cluster.network.host.prefix',
                tooltip: 'tooltip.creation.ocp.cluster.network.host.prefix',
                placeholder: 'creation.ocp.cluster.network.host.prefix.placeholder',
                active: '23',
                validation: VALIDATE_NUMERIC,
            },
            {
                id: 'serviceNetwork',
                type: 'text',
                name: 'creation.ocp.service.network',
                tooltip: 'tooltip.creation.ocp.service.network',
                placeholder: 'creation.ocp.service.network.placeholder',
                active: '172.30.0.0/16',
                validation: VALIDATE_CIDR,
            },
            {
                id: 'machineCIDR',
                type: 'text',
                name: 'creation.ocp.machine.cidr',
                tooltip: 'tooltip.creation.ocp.machine.cidr',
                placeholder: 'creation.ocp.machine.cidr.placeholder',
                active: '10.0.0.0/16',
                validation: VALIDATE_CIDR,
            },
        ],
    },
]

export const proxyControlData = [
    {
        id: 'proxyStep',
        type: 'step',
        title: 'Proxy',
    },
    {
        id: 'proxyInfo',
        type: 'title',
        info: 'Production environments can deny direct access to the Internet and instead have an HTTP or HTTPS proxy available. You can configure a new OpenShift Container Platform cluster to use a proxy by configuring the proxy settings.',
    },
    {
        name: 'Use proxy',
        id: 'hasProxy',
        type: 'checkbox',
        active: false,
        onSelect: onChangeProxy,
    },
    {
        id: 'httpProxy',
        type: 'text',
        name: 'Http Proxy',
        disabled: true,
        tip: 'Requires this format: http://<username>:<pswd>@<ip>:<port>',
        validation: VALIDATE_URL,
    },
    {
        id: 'httpsProxy',
        type: 'text',
        name: 'Https Proxy',
        tip: 'Requires this format: https://<username>:<pswd>@<ip>:<port>',
        disabled: true,
        validation: VALIDATE_URL,
    },
    {
        active: [],
        id: 'noProxy',
        type: 'values',
        name: 'No Proxy',
        disabled: true,
        tip: 'Add comma separated sites to bypass the proxy. By default, all cluster egress traffic is proxied, including calls to hosting cloud provider APIs.',
    },
    {
        id: 'additionalTrustBundle',
        type: 'textarea',
        name: 'Additional Trust Bundle',
        disabled: true,
        placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
    },
]

export const automationControlData = [
    ///////////////////////  automation  /////////////////////////////////////
    {
        id: 'automationStep',
        type: 'step',
        title: 'template.clusterCreate.title',
    },
    {
        id: 'chooseTemplate',
        type: 'title',
        info: 'template.clusterCreate.info',
    },
    {
        name: 'template.clusterCreate.name',
        id: 'templateName',
        type: 'combobox',
        tooltip: 'template.clusterCreate.tooltip',
        placeholder: 'template.clusterCreate.select.placeholder',
        validation: {
            required: false,
        },
        prompts: CREATE_AUTOMATION_TEMPLATE,
    },
]

export const isHidden_lt_OCP48 = (control, controlData) => {
    const singleNodeFeatureFlag = controlData.find(({ id }) => id === 'singleNodeFeatureFlag')
    const imageSet = controlData.find(({ id }) => id === 'imageSet')
    //NOTE: We will need to adjust this in the future for new OCP versions!
    if (
        singleNodeFeatureFlag &&
        singleNodeFeatureFlag.active &&
        imageSet &&
        imageSet.active &&
        (imageSet.active.includes('release:4.8') ||
            imageSet.active.includes('release:4.9') ||
            imageSet.active.includes('release:4.10'))
    ) {
        return false
    }
    return true
}

export const isHidden_gt_OCP46 = (control, controlData) => {
    const imageSet = controlData.find(({ id }) => id === 'imageSet')
    return !(imageSet && imageSet.active && imageSet.active.includes('release:4.6'))
}

export const isHidden_SNO = (control, controlData) => {
    const singleNode = controlData.find(({ id }) => id === 'singleNode')
    return singleNode && singleNode.active && !isHidden_lt_OCP48(control, controlData)
}

export const onChangeSNO = (control, controlData) => {
    var groupDataArray = controlData.find(({ id }) => id === 'workerPools').active
    groupDataArray.forEach((group) => {
        var computeNodeCount = group.find(({ id }) => id === 'computeNodeCount')
        if (!control.active) {
            if (computeNodeCount) {
                computeNodeCount.active = '3'
            }
        }
    })
}

export const addSnoText = (controlData) => {
    const masterPool = controlData.find((object) => object.id == 'masterPool')
    const poolControlData = masterPool.controlData.find((object) => object.id == 'masterPool')
    poolControlData.info = 'creation.ocp.node.controlplane.pool.info.sno_enabled'
}

export const arrayItemHasKey = (options, key) => {
    return options && options.some((o) => o[key])
}
