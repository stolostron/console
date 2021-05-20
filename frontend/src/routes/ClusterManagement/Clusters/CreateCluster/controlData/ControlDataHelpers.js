/* Copyright Contributors to the Open Cluster Management project */

import { VALIDATE_CIDR, VALIDATE_NUMERIC, VALIDATE_BASE_DNS_NAME_REQUIRED } from 'temptifly'
import { listClusterImageSets } from '../../../../../resources/cluster-image-set'
import { unpackProviderConnection } from '../../../../../resources/provider-connection'
import { NavigationPath } from '../../../../../NavigationPath'
import _ from 'lodash'

export const CREATE_CLOUD_CONNECTION = {
    prompt: 'creation.ocp.cloud.add.connection',
    type: 'link',
    url: NavigationPath.addCredentials,
    positionBottomRight: true,
    id: 'add-provider-connection',
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
        control.availableMap[c.metadata.name] = { replacements }
        control.hasReplacements = true
        control.noHandlebarReplacements = true
        control.isLoaded = true
    })
    control.available = connections.map((secret) => secret.metadata.name)
}

export const networkingControlData = [
    ///////////////////////  networking  /////////////////////////////////////
    {
        name: 'creation.ocp.baseDomain',
        tooltip: 'tooltip.creation.ocp.baseDomain',
        id: 'baseDomain',
        type: 'text',
        validation: VALIDATE_BASE_DNS_NAME_REQUIRED,
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
                subtitle: 'creation.ocp.node.network.title',
                info: 'creation.ocp.node.network.info',
            },
            {
                id: 'clusterNetwork',
                type: 'text',
                name: 'creation.ocp.cluster.network',
                tooltip: 'tooltip.creation.ocp.cluster.network',
                active: '10.128.0.0/14',
                validation: VALIDATE_CIDR,
            },
            {
                id: 'hostPrefix',
                type: 'text',
                name: 'creation.ocp.cluster.network.host.prefix',
                tooltip: 'tooltip.creation.ocp.cluster.network.host.prefix',
                active: '23',
                validation: VALIDATE_NUMERIC,
            },
            {
                id: 'serviceNetwork',
                type: 'text',
                name: 'creation.ocp.service.network',
                tooltip: 'tooltip.creation.ocp.service.network',
                active: '172.30.0.0/16',
                validation: VALIDATE_CIDR,
            },
            {
                id: 'machineCIDR',
                type: 'text',
                name: 'creation.ocp.machine.cidr',
                tooltip: 'tooltip.creation.ocp.machine.cidr',
                active: '10.0.0.0/16',
                validation: VALIDATE_CIDR,
            },
        ],
    },
]
