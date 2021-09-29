/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { Trans } from 'react-i18next'

import Handlebars from 'handlebars'
import installConfigHbs from '../templates/install-config.hbs'
import aiTemplateHbs from '../templates/assisted-installer/assisted-template.hbs'
import { AcmIconVariant, AcmIcon } from '@open-cluster-management/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'

import getControlDataAWS from './ControlDataAWS'
import getControlDataGCP from './ControlDataGCP'
import getControlDataAZR from './ControlDataAZR'
import getControlDataVMW from './ControlDataVMW'
import getControlDataBMC from './ControlDataBMC'
import getControlDataOST from './ControlDataOST'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo, BaremetalLogo } from './Logos'
import controlDataAI from './ControlDataAI'
import Deprecated from '../../components/Deprecated'

const { TechnologyPreview, PreviewBadgePosition } = CIM

const installConfig = Handlebars.compile(installConfigHbs)

const aiTemplate = Handlebars.compile(aiTemplateHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

export const getControlData = (warning, onControlSelect, awsPrivateFeatureGate = false) => [
    ///////////////////////  container platform  /////////////////////////////////////
    {
        id: 'distStep',
        type: 'step',
        title: 'Infrastructure provider',
    },
    {
        id: 'warning',
        type: 'custom',
        component: warning,
    },
    ///////////////////////  cloud  /////////////////////////////////////
    {
        id: 'infrastructure',
        type: 'cards',
        sort: false,
        pauseControlCreationHereUntilSelected: true,
        scrollViewAfterSelection: 300,
        onSelect: onControlSelect,
        available: [
            {
                id: 'AWS',
                logo: <AwsLogo />,
                title: 'cluster.create.aws.subtitle',
                change: {
                    insertControlData: getControlDataAWS(true, awsPrivateFeatureGate),
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
                tooltip: 'cluster.create.ai.tooltip',
                text: <TechnologyPreview position={PreviewBadgePosition.inline} className="pf-u-font-size-xs" />,
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
                // text: <Deprecated />,
                change: {
                    insertControlData: getControlDataBMC(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
        ],
        sectionTooltips: {
            'Centrally managed': <Trans i18nKey="create:cluster.create.centrallymanaged.section.tooltip" />,
        },
        active: getActiveCardID,
        validation: {
            notification: 'creation.ocp.cluster.must.select.infrastructure',
            required: true,
        },
    },
]
