/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'

import Handlebars from 'handlebars'
import installConfigHbs from '../../../ManagedClusters/CreateCluster/templates/install-config.hbs'
import { keyBy, cloneDeep } from 'lodash'

import getControlDataAWS from '../../../ManagedClusters/CreateCluster/controlData/ControlDataAWS'
import getControlDataGCP from '../../../ManagedClusters/CreateCluster/controlData/ControlDataGCP'
import getControlDataAZR from '../../../ManagedClusters/CreateCluster/controlData/ControlDataAZR'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo } from '../../../ManagedClusters/CreateCluster/controlData/Logos'

const installConfig = Handlebars.compile(installConfigHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

export const getDistributionTitle = (ctrlData, groupData, i18n) => {
    const activeObject = groupData.find((object) => object.id === 'distribution')
    const active = activeObject['active']
    if (active && activeObject['availableMap']) {
        const title = activeObject['availableMap'][active].title
        // TODO - Handle interpolation
        return i18n('Select an infrastructure provider to host your {{0}} cluster.', [title])
    }
    return ''
}

const fixupControlsForClusterPool = (controlData) => {
    const map = keyBy(controlData, 'id')
    map['detailStep'].title = 'Cluster pool details'
    map['name'].name = 'Cluster pool name'
    map['name'].tooltip =
        'The unique name of your cluster pool. The value must be a string that contains lowercase alphanumeric values, such as dev. Cannot be changed after creation.'
    map['name'].reverse = 'ClusterPool[0].metadata.name'
    map['region'].reverse = 'ClusterPool[0].metadata.labels.region'

    let inx = controlData.findIndex(({ id }) => id === 'additional')
    controlData.splice(inx, 1)

    inx = controlData.findIndex(({ id }) => id === 'name')
    controlData.splice(
        inx + 1,
        0,
        {
            name: 'Cluster pool namespace',
            tooltip:
                'The namespace to create your cluster pool. Multiple cluster pools can be created in the same namespace.',
            id: 'namespace',
            type: 'combobox',
            placeholder: 'Select or create a namespace',
            validation: {
                required: true,
            },
            available: [],
        },
        {
            name: 'Cluster pool size',
            tooltip: 'The desired number of clusters for the cluster pool.',
            id: 'size',
            type: 'number',
            initial: '1',
            validation: {
                required: true,
            },
            // cacheUserValueKey: 'create.cluster.compute.node.count',
        }
    )

    return controlData
}

export const getControlData = (includeAwsPrivate = false, snoFeatureGate = false) => {
    const fixedUpAWS = fixupControlsForClusterPool(
        cloneDeep(getControlDataAWS(false, includeAwsPrivate, snoFeatureGate))
    )
    const fixedUpGCP = fixupControlsForClusterPool(cloneDeep(getControlDataGCP(false, snoFeatureGate)))
    const fixedUpAZR = fixupControlsForClusterPool(cloneDeep(getControlDataAZR(false, snoFeatureGate)))

    return [
        ///////////////////////  container platform  /////////////////////////////////////
        {
            id: 'distStep',
            type: 'step',
            title: 'Infrastructure provider',
        },
        {
            id: 'showSecrets',
            type: 'hidden',
            active: false,
        },
        {
            id: 'chooseDist',
            type: 'title',
            info: 'Choose an infrastructure type to host your Red Hat OpenShift Container Platform cluster.',
            tooltip: 'The type of Kubernetes distribution you are using. Cannot be changed after creation.',
        },
        {
            id: 'distribution',
            type: 'cards',
            sort: false,
            pauseControlCreationHereUntilSelected: false,
            active: 'OpenShift',
            available: [
                {
                    id: 'OpenShift',
                    logo: <RedHatLogo />,
                    title: 'Red Hat OpenShift Container Platform',
                },
            ],
            validation: {
                notification: 'Select an orchestration',
                required: true,
            },
        },
        ///////////////////////  cloud  /////////////////////////////////////
        {
            id: 'chooseInfra',
            type: 'title',
            info: getDistributionTitle,
            tooltip:
                'The provider to host the control plane and compute plane machines. Cannot be changed after creation.',
            learnMore: 'https://docs.openshift.com/container-platform/4.3/installing/',
        },
        {
            id: 'infrastructure',
            type: 'cards',
            sort: false,
            pauseControlCreationHereUntilSelected: true,
            scrollViewAfterSelection: 300,
            available: [
                {
                    id: 'AWS',
                    logo: <AwsLogo />,
                    title: 'Amazon Web Services',
                    change: {
                        insertControlData: fixedUpAWS,
                        replacements: {
                            'install-config': { template: installConfig, encode: true, newTab: true },
                        },
                    },
                },
                {
                    id: 'GCP',
                    logo: <GoogleLogo />,
                    title: 'Google Cloud',
                    change: {
                        insertControlData: fixedUpGCP,
                        replacements: {
                            'install-config': { template: installConfig, encode: true, newTab: true },
                        },
                    },
                },
                {
                    id: 'Azure',
                    logo: <AzureLogo />,
                    title: 'Microsoft Azure',
                    change: {
                        insertControlData: fixedUpAZR,
                        replacements: {
                            'install-config': { template: installConfig, encode: true, newTab: true },
                        },
                    },
                },
                // {
                //     id: 'vSphere',
                //     logo: <VMwareLogo />,
                //     title: 'cluster.create.vmware.subtitle',
                //     change: {
                //         insertControlData: controlDataVMW,
                //         replacements: {
                //             'install-config': { template: installConfig, encode: true, newTab: true },
                //         },
                //     },
                // },
                // {
                //     id: 'OpenStack',
                //     logo: <RedHatLogo />,
                //     title: 'cluster.create.redhat.subtitle',
                //     change: {
                //         insertControlData: controlDataOST,
                //         replacements: {
                //             'install-config': { template: installConfig, encode: true, newTab: true },
                //         },
                //     },
                // },
                // {
                //     id: 'BMC',
                //     logo: <BaremetalLogo />,
                //     title: 'cluster.create.baremetal.subtitle',
                //     change: {
                //         insertControlData: controlDataBMC,
                //         replacements: {
                //             'install-config': { template: installConfig, encode: true, newTab: true },
                //         },
                //     },
                // },
            ],
            active: getActiveCardID,
            validation: {
                notification: 'Select an infrastructure',
                required: true,
            },
        },
    ]
}
