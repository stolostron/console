/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line no-use-before-define
import React from 'react'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_OCP_IMAGES,
    clusterDetailsControlData,
    networkingControlData,
    proxyControlData,
    automationControlData,
    getSimplifiedImageName,
    isHidden_SNO,
    onChangeConnection,
} from './ControlDataHelpers'
import {
    ControlMode,
    VALIDATE_CIDR,
    VALIDATE_IP_AGAINST_MACHINE_CIDR,
    VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
    VALIDATE_ALPHANUMERIC,
    VALIDATE_ALPHANUMERIC_PERIOD,
    VALIDATE_MAC_ADDRESS,
} from 'temptifly'
import { listBareMetalAssets } from '../../../../../../resources'
import WrappedImportBareMetalAssetsButton from '../components/WrappedImportBareMetalAssetsButton'
import _ from 'lodash'

const VALID_BMC_ADDR_REGEXP = new RegExp(
    '^((ipmi|idrac|idrac\\+http|idrac-virtualmedia|irmc|redfish|redfish\\+http|redfish-virtualmedia|ilo5-virtualmedia|https?|ftp):\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3})|' + // OR ip (v4) address
        '\\[?(([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])]))\\]?' + // OR ip (v6) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
    'i'
)

export const VALIDATE_BMC_ADDR = {
    tester: VALID_BMC_ADDR_REGEXP,
    notification: 'modal.create-acmbaremetalasset.bmc-address.invalid',
    required: true,
}

const VALIDATE_CIDR_OPTIONAL = _.cloneDeep(VALIDATE_CIDR)
VALIDATE_CIDR_OPTIONAL.required = false

const isHidden_gt_OCP44 = (control, controlData) => {
    const imageSet = controlData.find(({ id }) => id === 'imageSet')
    if (imageSet && imageSet.active && imageSet.active.includes('release:4.4')) {
        return false
    }
    return true
}

const showDNSVIP = (control, controlData) => {
    return !isHidden_gt_OCP44(control, controlData)
}

const getRoleCount = (theRole, control, controlData) => {
    let count = 0
    const hosts = controlData.find(({ id }) => id === 'hosts')
    if (hosts) {
        const { active = [] } = hosts
        count = active.reduce((total, { role }) => {
            if (role === theRole) {
                total++
            }
            return total
        }, 0)
    }
    return count + ''
}

const setAvailableBMAs = (control, result) => {
    const { loading } = result
    const { data } = result
    const bmas = data
    if (!control.isLoaded) {
        control.available = []
        control.isLoading = false
        const error = bmas ? null : result.error
        if (error) {
            control.isFailed = true
        } else if (bmas) {
            control.isLoaded = true
            control.active = []
            control.available = bmas
                .filter((bma) => {
                    return !_.get(bma, 'spec.clusterDeployment.name')
                })
                .map(formatBMA)
                .sort(({ hostName: a }, { hostName: b }) => {
                    return a.localeCompare(b)
                })
            control.available.forEach((datum) => {
                datum.id = datum.id.toString()
            })
        } else {
            control.isLoading = loading
        }
    }
}

const formatBMA = (bma) => ({
    id: bma.metadata.uid,
    macAddress: bma.spec.bootMACAddress,
    credName: bma.spec.bmc.credentialsName,
    credNamespace: bma.metadata.namespace,
    bmcAddress: bma.spec.bmc.address,
    hostName: bma.metadata.name,
    hostNamespace: bma.metadata.namespace,
})

const sortTable = (items, selectedKey, sortDirection, active) => {
    if (selectedKey === 'role' && active.length > 0) {
        const sorting = ['master', 'worker', 'unactive']
        const activeMap = _.keyBy(active, 'id')
        items.sort(({ id: a }, { id: b }) => {
            if (activeMap[a] && !activeMap[b]) {
                return -1
            } else if (!activeMap[a] && activeMap[b]) {
                return 1
            } else {
                return (
                    (sorting.indexOf(_.get(activeMap[a], 'role', 'unactive')) -
                        sorting.indexOf(_.get(activeMap[b], 'role', 'unactive'))) *
                    (sortDirection === 'asc' ? 1 : -1)
                )
            }
        })
        return items
    }
    return _.orderBy(items, [selectedKey], [sortDirection])
}

const validateTable = (active = [], control, controlData) => {
    let master = 0
    let snoEnabled = isHidden_SNO(control, controlData)

    //count number of masters
    active.forEach(({ role }) => {
        if (role === 'master') {
            master++
        }
    })
    //SNO only needs one master
    if (snoEnabled) {
        if (master !== 1) {
            return 'creation.ocp.validation.errors.hosts.sno'
        }
    } else {
        if (master < 3) {
            return 'creation.ocp.validation.errors.hosts'
        }
    }
    return null
}

const getActiveRole = (active = []) => {
    let master = 0
    active.forEach(({ role }) => {
        if (role === 'master') {
            master++
        }
    })
    return master < 3 ? 'master' : 'worker'
}

const getHostsTitle = (control, controlData, i18n) => {
    if (isHidden_SNO(control, controlData)) {
        return i18n('creation.ocp.choose.hosts.sno')
    } else {
        return i18n('creation.ocp.choose.hosts')
    }
}

export const getControlDataBMC = (includeAutomation = true) => {
    if (includeAutomation) return [...controlDataBMC, ...automationControlData]
    return [...controlDataBMC]
}

const onChangeProvisioningNetwork = (control, controlData) => {
    const infrastructure = controlData.find(({ id }) => {
        return id === 'connection'
    })
    const { active, availableMap = {} } = infrastructure
    const replacements = _.get(availableMap[active], 'replacements')
    const useProvisioningNetwork = control.active
    ;['provisioningNetworkCIDR', 'provisioningNetworkInterface', 'provisioningNetworkBridge'].forEach((pid) => {
        const ctrl = controlData.find(({ id }) => id === pid)
        if (ctrl) {
            ctrl.disabled = !useProvisioningNetwork
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

const controlDataBMC = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        providerId: 'bmc',
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
        fetchAvailable: LOAD_OCP_IMAGES('bmc'),
        validation: {
            notification: 'creation.ocp.cluster.must.select.ocp.image',
            required: true,
        },
    },
    {
        name: 'creation.ocp.addition.labels',
        id: 'additional',
        type: 'labels',
        active: [],
        tip: 'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.',
    },

    ///////////////////////  hosts  /////////////////////////////////////
    {
        id: 'hostsStep',
        type: 'step',
        title: 'Hosts',
    },
    {
        id: 'hostsSections',
        type: 'title',
        tooltip: 'tooltip.creation.ocp.cluster.hosts',
    },
    {
        id: 'chooseHosts',
        type: 'title',
        info: getHostsTitle,
    },
    {
        id: 'hosts',
        type: 'table',
        prompts: {
            actions: [<WrappedImportBareMetalAssetsButton key="import-bmas" />],
        },
        validation: {
            tester: validateTable.bind(null),
        },
        sortTable,
        summaryKey: 'hostName', // when table is collapsed, collapsed summary is composed of a list of this table value
        controlData: [
            ///////////////////////  host name  /////////////////////////////////////
            {
                name: 'creation.ocp.host.name',
                id: 'hostName',
                type: 'text',
                width: '25%',
                validation: VALIDATE_ALPHANUMERIC,
            },
            {
                name: 'creation.ocp.host.namespace',
                id: 'hostNamespace',
                type: 'text',
                width: '40%',
                validation: VALIDATE_ALPHANUMERIC,
            },
            {
                name: 'creation.ocp.host.role',
                id: 'role',
                type: 'toggle',
                active: getActiveRole,
                width: '20%',
                available: ['master', 'worker'],
                validation: {
                    notification: 'creation.ocp.cluster.valid.key',
                    required: true,
                },
            },
            {
                name: 'creation.ocp.host.bmc.address',
                id: 'bmcAddress',
                type: 'text',
                width: '50%',
                validation: VALIDATE_BMC_ADDR,
            },
            {
                name: 'creation.ocp.host.mac.address',
                id: 'macAddress',
                type: 'text',
                validation: VALIDATE_MAC_ADDRESS,
                mode: ControlMode.PROMPT_ONLY,
            },
            {
                name: 'creation.ocp.host.user',
                id: 'username',
                type: 'text',
                active: '# injected by server',
                validation: VALIDATE_ALPHANUMERIC,
                mode: ControlMode.PROMPT_ONLY,
            },
            {
                name: 'creation.ocp.host.password',
                id: 'password',
                type: 'password',
                active: '# injected by server',
                mode: ControlMode.PROMPT_ONLY,
            },
        ],
        fetchAvailable: {
            query: () => {
                return listBareMetalAssets().promise
            },
            loadingDesc: 'table.bma.loading',
            setAvailable: setAvailableBMAs,
        },
        active: [],
    },
    {
        id: 'disableCertificateVerification',
        type: 'checkbox',
        name: 'creation.ocp.host.disable.certificate.verification',
        tooltip: 'tooltip.creation.ocp.host.disable.certificate.verification',
        hidden: (control, controlData) => {
            const hosts = controlData.find(({ id }) => id === 'hosts')
            return !hosts || !hosts.available || hosts.available.length === 0
        },
        active: 'true',
        available: ['false', 'true'],
    },
    {
        id: 'masterNodeCount',
        type: 'hidden',
        getActive: getRoleCount.bind(null, 'master'),
    },
    {
        id: 'computeNodeCount',
        type: 'hidden',
        getActive: getRoleCount.bind(null, 'worker'),
    },
    {
        id: 'networkStep',
        type: 'step',
        title: 'Networking',
    },
    {
        name: 'Use provisioning network',
        id: 'hasProvisioningNetwork',
        type: 'checkbox',
        active: false,
        onSelect: onChangeProvisioningNetwork,
    },
    {
        id: 'provisioningNetworkCIDR',
        type: 'text',
        name: 'creation.ocp.network.cidr',
        tooltip: 'tooltip.creation.ocp.network.cidr',
        placeholder: 'creation.ocp.network.cidr.placeholder',
        active: '',
        disabled: true,
        validation: VALIDATE_CIDR_OPTIONAL,
    },
    {
        id: 'provisioningNetworkInterface',
        type: 'text',
        name: 'creation.ocp.network.interface',
        tooltip: 'tooltip.creation.ocp.network.interface',
        placeholder: 'creation.ocp.network.interface.placeholder',
        saveActive: 'enp1s0',
        disabled: true,
        validation: VALIDATE_ALPHANUMERIC,
    },
    {
        id: 'provisioningNetworkBridge',
        type: 'text',
        name: 'creation.ocp.network.bridge',
        tooltip: 'tooltip.creation.ocp.network.bridge',
        placeholder: 'creation.ocp.network.bridge.placeholder',
        saveActive: 'provisioning',
        disabled: true,
        validation: VALIDATE_ALPHANUMERIC_PERIOD,
    },
    {
        id: 'externalNetworkBridge',
        type: 'text',
        name: 'creation.ocp.external.bridge',
        tooltip: 'tooltip.creation.ocp.external.bridge',
        placeholder: 'creation.ocp.external.bridge.placeholder',
        active: 'baremetal',
        validation: VALIDATE_ALPHANUMERIC_PERIOD,
    },
    {
        id: 'dnsVIP',
        type: 'text',
        name: 'creation.ocp.dns.vip',
        hidden: isHidden_gt_OCP44,
        tooltip: 'tooltip.creation.ocp.dns.vip',
        active: '',
        validation: VALIDATE_IP_AGAINST_MACHINE_CIDR,
    },
    {
        id: 'showDNSVIP',
        type: 'hidden',
        getActive: showDNSVIP,
    },
    {
        id: 'apiVIP',
        type: 'text',
        name: 'creation.ocp.api.vip',
        placeholder: 'creation.ocp.api.vip.placeholder',
        tooltip: 'tooltip.creation.ocp.api.vip',
        active: '',
        validation: VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
    },
    {
        id: 'ingressVIP',
        type: 'text',
        name: 'creation.ocp.ingress.vip',
        tooltip: 'tooltip.creation.ocp.ingress.vip',
        placeholder: 'creation.ocp.ingress.vip.placeholder',
        active: '',
        validation: VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
    },
    ...networkingControlData,
    ...proxyControlData,
]
export default getControlDataBMC
