/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'

import Handlebars from 'handlebars'
import installConfigHbs from '../../../ManagedClusters/CreateCluster/templates/install-config.hbs'
import { keyBy, cloneDeep } from 'lodash'
import getControlDataAWS from '../../../ManagedClusters/CreateCluster/controlData/ControlDataAWS'
import getControlDataGCP from '../../../ManagedClusters/CreateCluster/controlData/ControlDataGCP'
import getControlDataAZR from '../../../ManagedClusters/CreateCluster/controlData/ControlDataAZR'
import { AwsLogo, GoogleLogo, AzureLogo } from '../../../ManagedClusters/CreateCluster/controlData/Logos'

const installConfig = Handlebars.compile(installConfigHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

const lessThanEqualSize = (active, templateObjectMap, i18n) => {
    const runningCount = active
    const size = templateObjectMap['<<main>>'].ClusterPool[0].$raw.spec.size
    if (runningCount > size) {
        return i18n('clusterPool.creation.validation.runningCount.lessThanOrEqualSize')
    }
}

const fixupControlsForClusterPool = (controlData) => {
    const map = keyBy(controlData, 'id')
    map['detailStep'].title = 'Cluster pool details'
    map['name'].name = 'clusterPool.creation.ocp.name'
    map['name'].tooltip = 'clusterPool.tooltip.creation.ocp.name'
    map['name'].reverse = 'ClusterPool[0].metadata.name'
    map['region'].reverse = 'ClusterPool[0].metadata.labels.region'

    let inx = controlData.findIndex(({ id }) => id === 'additional')
    controlData.splice(inx, 1)

    inx = controlData.findIndex(({ id }) => id === 'name')
    controlData.splice(
        inx + 1,
        0,
        {
            name: 'clusterPool.creation.ocp.namespace',
            tooltip: 'clusterPool.tooltip.creation.ocp.namespace',
            id: 'namespace',
            type: 'combobox',
            placeholder: 'clusterPool.placeholder.creation.ocp.namespace',
            validation: {
                required: true,
            },
            available: [],
        },
        {
            name: 'clusterPool.creation.ocp.size',
            tooltip: 'clusterPool.tooltip.creation.ocp.size',
            id: 'size',
            type: 'number',
            initial: '1',
            validation: {
                required: true,
            },
            // cacheUserValueKey: 'create.cluster.compute.node.count',
        },
        {
            name: 'clusterPool.creation.ocp.runningCount',
            tooltip: 'clusterPool.tooltip.creation.ocp.runningCount',
            id: 'runningCount',
            type: 'number',
            initial: '0',
            validation: {
                required: true,
                contextTester: lessThanEqualSize,
            },
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
        ///////////////////////  cloud  /////////////////////////////////////
        {
            id: 'chooseInfra',
            type: 'title',
            info: 'clusterPool.creation.ocp.choose.distribution',
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
                    title: 'cluster.create.aws.subtitle',
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
                    title: 'cluster.create.google.subtitle',
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
                    title: 'cluster.create.azure.subtitle',
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
                notification: 'creation.ocp.cluster.must.select.infrastructure',
                required: true,
            },
        },
    ]
}
