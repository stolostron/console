import { VALID_DNS_LABEL } from 'temptifly'
import installConfig from '../templates/install-config.hbs'

import awsControlData from './ControlDataAWS'
import gcpControlData from './ControlDataGCP'
import azrControlData from './ControlDataAZR'
import vmwControlData from './ControlDataVMW'
import bmcControlData from './ControlDataBMC'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo, BaremetalLogo } from './Logos'

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
        name: 'creation.ocp.name',
        tooltip: 'tooltip.creation.ocp.name',
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
                    insertControlData: awsControlData,
                    replacements: {
                        'install-config': { template: installConfig, encode: true },
                    },
                },
            },
            {
                id: 'GCP',
                logo: <GoogleLogo />,
                title: 'cluster.create.google.subtitle',
                change: {
                    insertControlData: gcpControlData,
                    replacements: {
                        'install-config': { template: installConfig, encode: true },
                    },
                },
            },
            {
                id: 'Azure',
                logo: <AzureLogo />,
                title: 'cluster.create.azure.subtitle',
                change: {
                    insertControlData: azrControlData,
                    replacements: {
                        'install-config': { template: installConfig, encode: true },
                    },
                },
            },
            {
                id: 'vSphere',
                logo: <VMwareLogo />,
                title: 'cluster.create.vmware.subtitle',
                change: {
                    insertControlData: vmwControlData,
                    replacements: {
                        'install-config': { template: installConfig, encode: true },
                    },
                },
            },
            {
                id: 'BMC',
                logo: <BaremetalLogo />,
                title: 'cluster.create.baremetal.subtitle',
                change: {
                    insertControlData: bmcControlData,
                    replacements: {
                        'install-config': { template: installConfig, encode: true },
                    },
                },
            },
        ],
        active: getActiveCardID,
        validation: {
            notification: 'creation.ocp.cluster.must.select.infrastructure',
            required: true,
        },
    },
]
