/* Copyright Contributors to the Open Cluster Management project */
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/styles'
import { Form, PageSection, SelectOption, Title, Wizard, WizardStep } from '@patternfly/react-core'
import {
    AcmForm,
    AcmInlineProvider,
    AcmLabelsInput,
    AcmSelect,
    AcmTextInput,
    Provider,
} from '@open-cluster-management/ui-components'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import {
    getProviderConnectionProviderID,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    setProviderConnectionProviderID,
} from '../../../../resources/provider-connection'
import { ProviderID, providers } from '../../../../lib/providers'
import { FeatureGate } from '../../../../resources/feature-gate'
import { validateKubernetesDnsName } from '../../../../lib/validation'

export function CreateProviderWizard(props: {
    providerConnection: ProviderConnection
    projects: string[]
    discoveryFeatureGate: FeatureGate | undefined
}) {
    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])
    const [steps, setSteps] = useState<WizardStep[]>([
        {
            name: 'Basic Information',
            component: (
                <CreateProviderInformationStep
                    providerConnection={props.providerConnection}
                    projects={props.projects}
                    discoveryFeatureGate={props.discoveryFeatureGate}
                />
            ),
        },
        // { name: 'Cloud provider', component: <CreateClusterWizardProviderStep /> },
        // {
        //     name: 'Node pools',
        //     steps: [
        //         { name: 'Master pool', component: <CreateClusterWizardNodePoolStep /> },
        //         { name: 'Worker pool 1', component: <CreateClusterWizardNodePoolStep /> },
        //     ],
        // },
        // { name: 'Networking', component: <CreateClusterWizardNetworkingStep /> },
        // { name: 'Review', component: <CreateClusterWizardReviewStep />, nextButtonText: 'Create' },
    ])
    return (
        <PageSection variant="light" type="wizard" isFilled>
            <Wizard steps={steps} height={'1000'} />
        </PageSection>
    )
}

export function CreateProviderInformationStep(props: {
    providerConnection: ProviderConnection
    projects: string[]
    discoveryFeatureGate: FeatureGate | undefined
}) {
    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])
    const [providerConnection, setProviderConnection] = useState<ProviderConnection>(
        JSON.parse(JSON.stringify(props.providerConnection))
    )
    const useStyles = makeStyles({
        providerSelect: {
            '& .pf-c-select__toggle-text': {
                padding: '4px 0',
            },
        },
    })
    const classes = useStyles()

    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }

    const isEditing = () => props.providerConnection.metadata.name !== ''

    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                Select a provider and enter basic information
            </Title>
            <Title headingLevel="h2" size="xl">
                Select a provider and enter basic information
            </Title>
            <AcmSelect
                className={classes.providerSelect}
                id="providerName"
                label={t('addConnection.providerName.label')}
                placeholder={t('addConnection.providerName.placeholder')}
                labelHelp={t('addConnection.providerName.labelHelp')}
                value={getProviderConnectionProviderID(providerConnection)}
                onChange={(providerID) => {
                    updateProviderConnection((providerConnection) => {
                        setProviderConnectionProviderID(providerConnection, providerID as ProviderID)
                    })
                }}
                isDisabled={isEditing()}
                isRequired
            >
                {providers
                    .filter((provider) => {
                        if (!props.discoveryFeatureGate && provider.key === ProviderID.CRH) {
                            return false // skip
                        }
                        return true
                    })
                    .map((provider) => {
                        let mappedProvider
                        switch (provider.key) {
                            case ProviderID.GCP:
                                mappedProvider = Provider.gcp
                                break
                            case ProviderID.AWS:
                                mappedProvider = Provider.aws
                                break
                            case ProviderID.AZR:
                                mappedProvider = Provider.azure
                                break
                            case ProviderID.VMW:
                                mappedProvider = Provider.vmware
                                break
                            case ProviderID.BMC:
                                mappedProvider = Provider.baremetal
                                break
                            case ProviderID.CRH:
                                mappedProvider = Provider.redhatcloud
                                break
                            case ProviderID.UKN:
                            default:
                                mappedProvider = Provider.other
                        }
                        return (
                            <SelectOption key={provider.key} value={provider.key}>
                                {/* {provider.name} */}
                                <AcmInlineProvider provider={mappedProvider} />
                            </SelectOption>
                        )
                    })}
            </AcmSelect>
            <AcmTextInput
                id="connectionName"
                label={t('addConnection.connectionName.label')}
                placeholder={t('addConnection.connectionName.placeholder')}
                labelHelp={t('addConnection.connectionName.labelHelp')}
                value={providerConnection.metadata.name}
                onChange={(name) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.metadata.name = name
                    })
                }}
                validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
                isDisabled={isEditing()}
            />
            <AcmSelect
                id="namespaceName"
                label={t('addConnection.namespaceName.label')}
                placeholder={t('addConnection.namespaceName.placeholder')}
                labelHelp={t('addConnection.namespaceName.labelHelp')}
                value={providerConnection.metadata.namespace}
                onChange={(namespace) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.metadata.namespace = namespace
                    })
                }}
                isRequired
                isDisabled={isEditing()}
                variant="typeahead"
            >
                {props.projects.map((project) => (
                    <SelectOption key={project} value={project}>
                        {project}
                    </SelectOption>
                ))}
            </AcmSelect>
        </AcmForm>
    )
}
