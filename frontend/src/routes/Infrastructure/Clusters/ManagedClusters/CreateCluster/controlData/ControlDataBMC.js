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
import { withTranslation } from 'react-i18next'
import WrappedImportBareMetalAssetsButton from '../components/WrappedImportBareMetalAssetsButton'
import _ from 'lodash'

const ImportBareMetalAssetsButton = withTranslation(['create'])(WrappedImportBareMetalAssetsButton)

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
            return '* A bare metal single node cluster requires one (1) control plane node.'
        }
    } else {
        if (master < 3) {
            return '* A bare metal cluster requires at least three (3) control plane nodes.'
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
        return i18n('Select 1 bare metal asset that is on the same bridge networks as the hypervisor.')
    } else {
        return i18n('Select at least 3 bare metal assets that are on the same bridge networks as the hypervisor.')
    }
}

export const getControlDataBMC = (includeAutomation = true) => {
    if (includeAutomation) return [...controlDataBMC, ...automationControlData]
    return [...controlDataBMC]
}

const controlDataBMC = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'Infrastructure provider credential',
        tooltip:
            'The settings that are required for the selected provider. You can select an existing connection, or add a new connection. Cannot be changed after creation.',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'Select a credential',
        providerId: 'bmc',
        validation: {
            notification: 'Select a connection',
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
        name: 'Release image',
        tooltip:
            'URL to the OpenShift install image set to use. Available images are listed, or you can enter your own path to add an image to the list.',
        id: 'imageSet',
        type: 'combobox',
        simplified: getSimplifiedImageName,
        placeholder: 'Select or enter a release image',
        fetchAvailable: LOAD_OCP_IMAGES('bmc'),
        validation: {
            notification: 'Select a release image',
            required: true,
        },
    },
    {
        name: 'Additional labels',
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
        tooltip: 'The bare metal assets which will serve as the hosts of this cluster.',
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
            actions: [<ImportBareMetalAssetsButton key="import-bmas" />],
        },
        validation: {
            tester: validateTable.bind(null),
        },
        sortTable,
        summaryKey: 'hostName', // when table is collapsed, collapsed summary is composed of a list of this table value
        controlData: [
            ///////////////////////  host name  /////////////////////////////////////
            {
                name: 'Name',
                id: 'hostName',
                type: 'text',
                width: '25%',
                validation: VALIDATE_ALPHANUMERIC,
            },
            {
                name: 'Namespace',
                id: 'hostNamespace',
                type: 'text',
                width: '40%',
                validation: VALIDATE_ALPHANUMERIC,
            },
            {
                name: 'Role',
                id: 'role',
                type: 'toggle',
                active: getActiveRole,
                width: '20%',
                available: ['master', 'worker'],
                validation: {
                    notification: 'Value must be a valid security key.',
                    required: true,
                },
            },
            {
                name: 'BMC address',
                id: 'bmcAddress',
                type: 'text',
                width: '50%',
                validation: VALIDATE_BMC_ADDR,
            },
            {
                name: 'MAC address',
                id: 'macAddress',
                type: 'text',
                validation: VALIDATE_MAC_ADDRESS,
                mode: ControlMode.PROMPT_ONLY,
            },
            {
                name: 'User',
                id: 'username',
                type: 'text',
                active: '# injected by server',
                validation: VALIDATE_ALPHANUMERIC,
                mode: ControlMode.PROMPT_ONLY,
            },
            {
                name: 'Password',
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
        name: 'Disable certificate verification',
        tooltip:
            'By default, hosts require valid certificates signed by a known certificate authority. Enable this option for environments where certificates are signed by unknown authorities.',
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
        id: 'provisioningNetworkCIDR',
        type: 'text',
        name: 'Provisioning network CIDR',
        tooltip: 'The CIDR for the network to use for provisioning. Example: 172.22.0.0/24',
        placeholder: 'Enter provisioning network CIDR',
        active: '',
        validation: VALIDATE_CIDR,
    },
    {
        id: 'provisioningNetworkInterface',
        type: 'text',
        name: 'Provisioning network interface',
        tooltip:
            'The name of the network interface on the control plane nodes that are connected to the provisioning network.',
        placeholder: 'Enter provisioning network interface',
        active: 'enp1s0',
        validation: VALIDATE_ALPHANUMERIC,
    },
    {
        id: 'provisioningNetworkBridge',
        type: 'text',
        name: 'Provisioning network bridge',
        tooltip: 'The name of the bridge on the hypervisor that is attached to the provisioning network.',
        placeholder: 'Enter provisioning network bridge',
        active: 'provisioning',
        validation: VALIDATE_ALPHANUMERIC_PERIOD,
    },
    {
        id: 'externalNetworkBridge',
        type: 'text',
        name: 'External network bridge',
        tooltip: 'The name of the bridge of the hypervisor that is attached to the external network.',
        placeholder: 'Enter external network bridge',
        active: 'baremetal',
        validation: VALIDATE_ALPHANUMERIC_PERIOD,
    },
    {
        id: 'dnsVIP',
        type: 'text',
        name: 'DNS VIP',
        hidden: isHidden_gt_OCP44,
        tooltip: 'The Virtual IP to use for internal DNS communication.',
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
        name: 'API VIP',
        placeholder: 'Enter API VIP',
        tooltip:
            'The Virtual IP to use for internal API communication. The DNS must be pre-configured with an A/AAAA or CNAME record so the api.<cluster name>.<Base DNS domain> path resolves correctly.',
        active: '',
        validation: VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
    },
    {
        id: 'ingressVIP',
        type: 'text',
        name: 'Ingress VIP',
        tooltip:
            'The Virtual IP to use for ingress traffic. The DNS must be pre-configured with an A/AAAA or CNAME record so the *.apps.<cluster name>.<Base DNS domain> path resolves correctly.',
        placeholder: 'Enter ingress VIP',
        active: '',
        validation: VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
    },
    ...networkingControlData,
    ...proxyControlData,
]
export default getControlDataBMC
