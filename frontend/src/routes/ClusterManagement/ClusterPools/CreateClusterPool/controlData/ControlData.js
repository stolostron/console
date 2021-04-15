/* Copyright Contributors to the Open Cluster Management project */

import { VALID_DNS_LABEL } from 'temptifly'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import installConfigHbs from '../templates/install-config.hbs'

import controlDataAWS from './ControlDataAWS'
import controlDataGCP from './ControlDataGCP'
import controlDataAZR from './ControlDataAZR'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo } from '../../../Clusters/CreateCluster/controlData/Logos'

const installConfig =
    typeof installConfigHbs !== 'string'
        ? installConfigHbs
        : Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/install-config.hbs'), 'utf8'))

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
        return i18n('creation.ocp.choose.infrastructure', [title])
    }
    return ''
}

export const controlData = [
    {
        id: 'main',
        type: 'section',
        title: 'creation.ocp.cluster.details',
        collapsable: true,
    },
    {
        name: 'clusterPool.creation.ocp.name',
        tooltip: 'clusterPool.tooltip.creation.ocp.name',
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
        name: 'clusterPool.creation.ocp.namespace',
        tooltip: 'clusterPool.tooltip.creation.ocp.namespace',
        id: 'namespace',
        type: 'singleselect',
        placeholder: 'clusterPool.placeholder.creation.ocp.namespace',
        validation: {
            required: true,
        },
        available: [],
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
        id: 'showSecrets',
        type: 'hidden',
        active: false,
    },

    ///////////////////////  container platform  /////////////////////////////////////
    {
        id: 'chooseDist',
        type: 'section',
        title: 'creation.ocp.distribution',
        info: 'creation.ocp.choose.distribution',
        tooltip: 'tooltip.creation.ocp.choose.distribution',
        overline: true,
        collapsable: true,
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
                title: 'cluster.create.ocp.subtitle',
            },
        ],
        validation: {
            notification: 'creation.ocp.cluster.must.select.orchestration',
            required: true,
        },
    },
    ///////////////////////  cloud  /////////////////////////////////////
    {
        id: 'chooseInfra',
        type: 'title',
        info: getDistributionTitle,
        tooltip: 'tooltip.creation.ocp.choose.aws.infrastructure',
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
                title: 'cluster.create.aws.subtitle',
                change: {
                    insertControlData: controlDataAWS,
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
                    insertControlData: controlDataGCP,
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
                    insertControlData: controlDataAZR,
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
