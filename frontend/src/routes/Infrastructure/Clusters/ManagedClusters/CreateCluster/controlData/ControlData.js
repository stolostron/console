/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { Trans } from '../../../../../../lib/acm-i18next'

import Handlebars from 'handlebars'
import installConfigHbs from '../templates/install-config.hbs'
import cimTemplateHbs from '../templates/assisted-installer/cim-template.hbs'
import aiTemplateHbs from '../templates/assisted-installer/ai-template.hbs'
import { AcmIconVariant, AcmIcon } from '@stolostron/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { ConnectedIcon } from '@patternfly/react-icons'

import getControlDataAWS from './ControlDataAWS'
import getControlDataGCP from './ControlDataGCP'
import getControlDataAZR from './ControlDataAZR'
import getControlDataVMW from './ControlDataVMW'
import getControlDataRHV from './ControlDataRHV'
import getControlDataBMC from './ControlDataBMC'
import getControlDataOST from './ControlDataOST'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo } from './Logos'
import ServerIcon from '@patternfly/react-icons/dist/js/icons/server-icon'
import { controlDataCIM, controlDataAI } from './ControlDataAI'

const { TechnologyPreview, PreviewBadgePosition } = CIM

const installConfig = Handlebars.compile(installConfigHbs)

const cimTemplate = Handlebars.compile(cimTemplateHbs)
const aiTemplate = Handlebars.compile(aiTemplateHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

export const getControlData = (
    warning,
    onControlSelect,
    awsPrivateFeatureGate = false,
    snoFeatureGate = false,
    includeKlusterletAddonConfig = true
) => [
    ///////////////////////  container platform  /////////////////////////////////////
    {
        id: 'distStep',
        type: 'step',
        title: 'Installation type',
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
    {
        id: 'includeKlusterletAddonConfig',
        type: 'hidden',
        active: includeKlusterletAddonConfig,
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
                    insertControlData: getControlDataAWS(true, awsPrivateFeatureGate, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'GCP',
                logo: <GoogleLogo />,
                title: 'cluster.create.google.subtitle',
                change: {
                    insertControlData: getControlDataGCP(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'Azure',
                logo: <AzureLogo />,
                title: 'cluster.create.azure.subtitle',
                change: {
                    insertControlData: getControlDataAZR(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'vSphere',
                logo: <VMwareLogo />,
                title: 'cluster.create.vmware.subtitle',
                change: {
                    insertControlData: getControlDataVMW(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'BMC',
                logo: <ServerIcon color="slategray" />,
                title: 'cluster.create.baremetal.subtitle',
                // text: <Deprecated />,
                change: {
                    insertControlData: getControlDataBMC(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'OpenStack',
                logo: <RedHatLogo />,
                title: 'cluster.create.redhat.subtitle',
                change: {
                    insertControlData: getControlDataOST(true, snoFeatureGate),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'RHV',
                logo: <RedHatLogo />,
                title: 'cluster.create.rhv.subtitle',
                change: {
                    insertControlData: getControlDataRHV(),
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Infrastructure providers',
            },
            {
                id: 'CIM',
                logo: <AcmIcon icon={AcmIconVariant.hybrid} />, // TODO(mlibra): change icon (requests graphics by UXD)
                title: 'cluster.create.cim.subtitle',
                tooltip: 'cluster.create.cim.tooltip',
                text: <TechnologyPreview position={PreviewBadgePosition.inline} className="pf-u-font-size-xs" />,
                change: {
                    insertControlData: controlDataCIM,
                    replacements: {},
                    replaceTemplate: cimTemplate,
                },
                section: 'Assisted installation',
            },
            {
                id: 'AI',
                logo: <ConnectedIcon />,
                title: 'cluster.create.ai.subtitle',
                tooltip: 'cluster.create.ai.tooltip',
                text: <TechnologyPreview position={PreviewBadgePosition.inline} className="pf-u-font-size-xs" />,
                change: {
                    insertControlData: controlDataAI,
                    replacements: {},
                    replaceTemplate: aiTemplate,
                },
                section: 'Assisted installation',
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
