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
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo } from './Logos'
import ServerIcon from '@patternfly/react-icons/dist/js/icons/server-icon'
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

export const getControlData = (warning, onControlSelect, awsPrivateFeatureGate = false, snoFeatureGate = false) => [
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
                title: 'Amazon Web Services',
                change: {
                    insertControlData: getControlDataAWS(true, awsPrivateFeatureGate, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'GCP',
                logo: <GoogleLogo />,
                title: 'Google Cloud',
                change: {
                    insertControlData: getControlDataGCP(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'Azure',
                logo: <AzureLogo />,
                title: 'Microsoft Azure',
                change: {
                    insertControlData: getControlDataAZR(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'vSphere',
                logo: <VMwareLogo />,
                title: 'VMware vSphere',
                change: {
                    insertControlData: getControlDataVMW(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'OpenStack',
                logo: <RedHatLogo />,
                title: 'Red Hat OpenStack Platform',
                change: {
                    insertControlData: getControlDataOST(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers',
            },
            {
                id: 'AI',
                logo: <AcmIcon icon={AcmIconVariant.hybrid} />,
                title: 'On-premises',
                tooltip: 'Create a cluster from hosts that have been discovered and made available.',
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
                logo: <ServerIcon color="slategray" />,
                title: 'Bare metal',
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
            'Centrally managed': (
                <Trans i18nKey="Simplify cluster self-service with infrastructure environments, which enable you to manage hosts, create ready-to-use host groups, and quickly create clusters based on provided infrastructure. To use infrastructure environments, select <strong>On Premise</strong>." />
            ),
        },
        active: getActiveCardID,
        validation: {
            notification: 'Select an infrastructure',
            required: true,
        },
    },
]
