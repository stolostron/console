/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'

import Handlebars from 'handlebars'
import installConfigHbs from '../templates/install-config.hbs'
import aiTemplateHbs from '../templates/assisted-installer/assisted-template.hbs'
import { AcmIconVariant, AcmIcon } from '@open-cluster-management/ui-components'

import getControlDataAWS from './ControlDataAWS'
import getControlDataGCP from './ControlDataGCP'
import getControlDataAZR from './ControlDataAZR'
import getControlDataVMW from './ControlDataVMW'
import getControlDataBMC from './ControlDataBMC'
import getControlDataOST from './ControlDataOST'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo, BaremetalLogo } from './Logos'
import controlDataAI from './ControlDataAI'

const installConfig = Handlebars.compile(installConfigHbs)

const aiTemplate = Handlebars.compile(aiTemplateHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

export const controlData = [
    ///////////////////////  container platform  /////////////////////////////////////
    {
        id: 'distStep',
        type: 'step',
        title: 'Infrastructure',
    },
    ///////////////////////  cloud  /////////////////////////////////////
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
                    insertControlData: getControlDataAWS(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'GCP',
                logo: <GoogleLogo />,
                title: 'cluster.create.google.subtitle',
                change: {
                    insertControlData: getControlDataGCP(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'Azure',
                logo: <AzureLogo />,
                title: 'cluster.create.azure.subtitle',
                change: {
                    insertControlData: getControlDataAZR(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'vSphere',
                logo: <VMwareLogo />,
                title: 'cluster.create.vmware.subtitle',
                change: {
                    insertControlData: getControlDataVMW(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'OpenStack',
                logo: <RedHatLogo />,
                title: 'cluster.create.redhat.subtitle',
                change: {
                    insertControlData: getControlDataOST(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'AI',
                logo: <AcmIcon icon={AcmIconVariant.hybrid} />,
                title: 'cluster.create.ai.subtitle',
                change: {
                    insertControlData: controlDataAI,
                    replacements: {},
                    replaceTemplate: aiTemplate,
                },
                section: 'Centrally managed',
            },
            {
                id: 'BMC',
                logo: <BaremetalLogo />,
                title: 'cluster.create.baremetal.subtitle',
                change: {
                    insertControlData: getControlDataBMC(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Centrally managed',
            },
        ],
        active: getActiveCardID,
        validation: {
            notification: 'creation.ocp.cluster.must.select.infrastructure',
            required: true,
        },
    },
]
