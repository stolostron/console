/* Copyright Contributors to the Open Cluster Management project */

import {
    getValue,
    VALIDATE_CIDR,
    VALIDATE_NUMERIC,
    VALIDATE_BASE_DNS_NAME_REQUIRED,
    VALID_DNS_LABEL,
    VALIDATE_URL,
    VALIDATE_ALPHANUMERIC,
    getNoProxyValidator,
} from '../../../../../../components/TemplateEditor'
import { getControlByID } from '../../../../../../lib/temptifly-utils'
import { listClusterImageSets } from '../../../../../../resources'
import { unpackProviderConnection } from '../../../../../../resources'
import { NavigationPath } from '../../../../../../NavigationPath'
import jsYaml from 'js-yaml'
import _ from 'lodash'
import { TemplateSummaryControl, TemplateLinkOutControl } from '../../../../../../components/TemplateSummaryModal'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AutomationProviderHint } from '../../../../../../components/AutomationProviderHint.tsx'

export const CREATE_CLOUD_CONNECTION = {
    prompt: 'creation.ocp.cloud.add.connection',
    type: 'link',
    url: NavigationPath.addCredentials,
    positionBottomRight: true,
    id: 'add-provider-connection',
    icon: <ExternalLinkAltIcon />,
}

export const CREATE_AUTOMATION_TEMPLATE = {
    prompt: 'creation.ocp.cloud.add.template',
    type: 'link',
    url: NavigationPath.addAnsibleAutomation,
    positionBottomRight: true,
    id: 'add-automation-template',
    icon: <ExternalLinkAltIcon />,
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
    const connections = secrets.filter((secret) => {
        const cedentalsType = secret.metadata.labels?.['cluster.open-cluster-management.io/type']
        return Array.isArray(control.providerId)
            ? control.providerId.includes(cedentalsType)
            : control.providerId === cedentalsType
    })
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
        if (!replacements['additionalTrustBundle']) {
            delete replacements['additionalTrustBundle']
        }
        control.availableMap[c.metadata.name] = { replacements }
        control.hasReplacements = true
        control.noHandlebarReplacements = true
        control.isLoaded = true
    })
    control.available = connections.map((secret) => secret.metadata.name)
    if (
        Array.isArray(control.providerId)
            ? !control.providerId.includes('hostinventory')
            : control.providerId !== 'hostinventory'
    ) {
        if (control.setActive && !control.active) {
            control.setActive(control.available[0])
        }
    }
}

export const setAvailableTemplates = (control, templates) => {
    control.available = templates.map((template) => template.metadata.name)
}

const onChangeProxy = (control, controlData) => {
    const infrastructure = getControlByID(controlData, 'connection')
    const { active, availableMap = {} } = infrastructure
    const replacements = _.get(availableMap[active], 'replacements')
    const useProxy = getControlByID(controlData, 'hasProxy').active
    ;['httpProxy', 'httpsProxy', 'noProxy', 'additionalTrustBundle'].forEach((pid) => {
        const ctrl = getControlByID(controlData, pid)
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
        const datbControl = getControlByID(controlData, 'disconnectedAdditionalTrustBundle')
        if (datbControl) {
            datbControl.active = replacements['additionalTrustBundle']
            datbControl.disabled = !datbControl.active
        }
    })
}

export const onChangeDisconnect = (control, controlData) => {
    const infrastructure = getControlByID(controlData, 'connection')
    const { active, availableMap = {} } = infrastructure
    const replacements = _.get(availableMap[active], 'replacements')
    const isDisconnected = getControlByID(controlData, 'isDisconnected').active
    ;['clusterOSImage', 'pullSecret', 'imageContentSources', 'disconnectedAdditionalTrustBundle'].forEach((pid) => {
        const ctrl = getControlByID(controlData, pid)
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

export const onImageChange = (control, controlData) => {
    const networkDefault = getControlByID(controlData, 'networkType')
    if (networkDefault) {
        const { setActive } = networkDefault
        const { active: version } = control

        if (versionGreater(version, 4, 11)) {
            setActive('OVNKubernetes')
        } else {
            setActive('OpenShiftSDN')
        }
    }
}

export const clusterDetailsControlData = [
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
        tip: 'Use the Federal Information Processing Standards (FIPS) modules provided with Red Hat Enterprise Linux CoreOS instead of the default Kubernetes cryptography suite.',
    },
    {
        id: 'showSecrets',
        type: 'hidden',
        active: false,
    },
]

export const clusterPoolDetailsControlData = [
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
        tip: 'Use the Federal Information Processing Standards (FIPS) modules provided with Red Hat Enterprise Linux CoreOS instead of the default Kubernetes cryptography suite.',
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
        active: 'OVNKubernetes',
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
        name: 'HTTP proxy',
        disabled: true,
        tip: 'Requires this format: http://<username>:<pswd>@<ip>:<port>',
        validation: VALIDATE_URL,
    },
    {
        id: 'httpsProxy',
        type: 'text',
        name: 'HTTPS proxy',
        tip: 'Requires this format: https://<username>:<pswd>@<ip>:<port>',
        disabled: true,
        validation: VALIDATE_URL,
    },
    {
        active: [],
        id: 'noProxy',
        type: 'values',
        name: 'No proxy',
        disabled: true,
        tip: 'noProxyTip',
        validation: getNoProxyValidator(),
    },
    {
        id: 'additionalTrustBundle',
        type: 'textarea',
        name: 'Additional trust bundle',
        disabled: true,
        placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
    },
]

export const onChangeAutomationTemplate = (control, controlData) => {
    const clusterCuratorSpec = getControlByID(controlData, 'clusterCuratorSpec')
    const installAttemptsLimit = getControlByID(controlData, 'installAttemptsLimit')
    // TODO: include namespace in key
    const clusterCuratorTemplate = control.availableData.find((cc) => cc.metadata.name === control.active)
    const curations = getControlByID(controlData, 'supportedCurations')?.active
    if (control.active && clusterCuratorTemplate) {
        const clusterCurator = _.cloneDeep(clusterCuratorTemplate)
        if (clusterCurator.spec?.install?.prehook?.length || clusterCurator.spec?.install?.posthook?.length) {
            clusterCurator.spec.desiredCuration = 'install'
            installAttemptsLimit.immutable = { value: 1, path: 'ClusterDeployment[0].spec.installAttemptsLimit' }
        }
        curations.forEach((curation) => {
            if (clusterCurator?.spec?.[curation]?.towerAuthSecret) {
                // Create copies of each Ansible secret
                const secretName = `toweraccess-${curation}`
                const secretControl = getControlByID(controlData, secretName)
                const matchingSecret = control.availableSecrets.find(
                    (s) =>
                        s.metadata.name === clusterCurator.spec[curation].towerAuthSecret &&
                        s.metadata.namespace === clusterCuratorTemplate.metadata.namespace
                )
                secretControl.active = _.cloneDeep(matchingSecret)
                clusterCurator.spec[curation].towerAuthSecret = secretName
            }
        })
        clusterCuratorSpec.active = jsYaml.dump({ spec: clusterCurator.spec })
    } else {
        // Clear Ansible secrets
        curations.forEach((curation) => {
            const secretName = `toweraccess-${curation}`
            const secretControl = getControlByID(controlData, secretName)
            secretControl.active = ''
        })
        clusterCuratorSpec.active = ''
        delete installAttemptsLimit.immutable
    }
}

const reverseClusterCuratorSpec = (control, templateObject) => {
    // preserve user modifications to ClusterCurator if valid YAML
    const active = getValue(templateObject, 'ClusterCurator[0].spec')
    if (active) {
        control.active = jsYaml.dump({ spec: active })
    }
}

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
        type: 'custom',
        id: 'automationProviderHint',
        component: <AutomationProviderHint />,
    },
    {
        name: 'template.clusterCreate.name',
        id: 'templateName',
        type: 'combobox',
        tooltip: 'template.clusterCreate.tooltip',
        placeholder: 'template.clusterCreate.select.placeholder',
        onSelect: onChangeAutomationTemplate,
        validation: {
            required: false,
        },
        prompts: CREATE_AUTOMATION_TEMPLATE,
    },
    {
        type: 'custom',
        id: 'curatorLinkOut',
        component: <TemplateLinkOutControl />,
    },
    {
        type: 'custom',
        id: 'curatorSummary',
        component: <TemplateSummaryControl />,
    },
    {
        id: 'clusterCuratorSpec',
        type: 'hidden',
        active: '',
        reverse: reverseClusterCuratorSpec,
    },
    {
        id: 'supportedCurations',
        type: 'values',
        hidden: true,
        active: [],
    },
    {
        id: 'toweraccess-install',
        type: 'hidden',
        active: '',
    },
    {
        id: 'toweraccess-upgrade',
        type: 'hidden',
        active: '',
    },
    {
        id: 'toweraccess-scale',
        type: 'hidden',
        active: '',
    },
    {
        id: 'toweraccess-destroy',
        type: 'hidden',
        active: '',
    },
    {
        active: 1,
        id: 'installAttemptsLimit',
        type: 'hidden',
    },
]

export const architectureData = [
    {
        name: 'Architecture',
        tooltip: 'tooltip.architecture',
        id: 'architecture',
        type: 'combobox',
        available: ['amd64'],
        validation: VALIDATE_ALPHANUMERIC,
        cacheUserValueKey: 'create.cluster.architecture',
    },
]

const versionRegex = /release:([\d]{1,5})\.([\d]{1,5})\.([\d]{1,5})/
function versionGreater(version, x, y) {
    const matches = version.match(versionRegex)
    return matches && parseInt(matches[1], 10) >= x && parseInt(matches[2], 10) > y
}

export const isHidden_lt_OCP48 = (control, controlData) => {
    const singleNodeFeatureFlag = getControlByID(controlData, 'singleNodeFeatureFlag')
    const imageSet = getControlByID(controlData, 'imageSet')
    if (singleNodeFeatureFlag && singleNodeFeatureFlag.active && imageSet && imageSet.active) {
        return !versionGreater(imageSet.active, 4, 7)
    }
    return true
}

export const isHidden_gt_OCP46 = (control, controlData) => {
    const imageSet = getControlByID(controlData, 'imageSet')
    return imageSet && imageSet.active && versionGreater(imageSet.active, 4, 6)
}

export const isHidden_SNO = (control, controlData) => {
    const singleNode = getControlByID(controlData, 'singleNode')
    return singleNode && singleNode.active && !isHidden_lt_OCP48(control, controlData)
}

export const onChangeSNO = (control, controlData) => {
    const groupDataArray = getControlByID(controlData, 'workerPools').active
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

export const append = (...args) => Array.prototype.slice.call(args, 0, -1).join('')

export const appendKlusterletAddonConfig = (includeKlusterletAddonConfig, controlData) => {
    const klusterletAddonConfigIdx = controlData.findIndex((control) => control.id === 'includeKlusterletAddonConfig')
    if (klusterletAddonConfigIdx > -1) {
        controlData[klusterletAddonConfigIdx].active = includeKlusterletAddonConfig
        return
    }
    controlData.push({
        id: 'includeKlusterletAddonConfig',
        type: 'hidden',
        active: includeKlusterletAddonConfig,
    })
}
