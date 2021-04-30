/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { useRecoilState } from 'recoil'
import { namespacesState, secretsState } from '../../../atoms'

import { AcmIcon, Provider, ProviderIconMap, ProviderLongTextMap } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData } from '../../../components/AcmFormData'
import { AcmSvgIcon } from '../../../components/AcmSvgIcon'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { DOC_LINKS } from '../../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../../lib/rbac-util'
import { createResource, replaceResource } from '../../../lib/resource-request'
import {
    Button,
    DataList,
    DataListCell,
    DataListControl,
    DataListDragButton,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    Divider,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateVariant,
    FormGroup,
    Grid,
    GridItem,
    InputGroup,
    PageSection,
    SelectOption,
    Text,
    TextContent,
    TextInput,
    TextVariants,
    Title,
    Wizard,
    WizardStep,
} from '@patternfly/react-core'
import {
    packProviderConnection,
    ProviderConnection,
    unpackProviderConnection,
} from '../../../resources/provider-connection'
import { IResource } from '../../../resources/resource'
import { getSecret, SecretDefinition } from '../../../resources/secret'
import {
    AnsibleJob,
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorDefinition,
    ClusterCuratorKind,
    getClusterCurator,
} from '../../../resources/cluster-curator'
import { V1ObjectMeta } from '@kubernetes/client-node'

export default function AnsibleAutomationsFormPage({
    match,
}: RouteComponentProps<{ namespace: string; name: string }>) {
    const { name, namespace } = match.params

    let isEditing = false
    let isViewing = false
    if (name !== undefined) {
        isEditing = match.path.endsWith(NavigationPath.editAnsibleAutomation)
        isViewing = !isEditing
    }

    const [error, setError] = useState<Error>()
    const [namespaces] = useRecoilState(namespacesState)
    const [projects, setProjects] = useState<string[]>()

    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const [clusterCuratorTemplate, setClusterCuratorTemplate] = useState<ClusterCurator | undefined>()

    const ansibleCredentials = providerConnections.filter((providerConnection) => providerConnection.spec?.host)

    useEffect(() => {
        if (isEditing || isViewing) {
            const result = getClusterCurator({ name, namespace })
            result.promise.then((curator) => setClusterCuratorTemplate(curator)).catch(setError)
            return result.abort
        }
        return undefined
    }, [isEditing, isViewing, name, namespace])

    if (error) return <ErrorPage error={error} />

    if (isEditing || isViewing) {
        if (!clusterCuratorTemplate) return <LoadingPage />
        return (
            <AnsibleAutomationsForm
                ansibleCredentials={ansibleCredentials}
                clusterCurator={clusterCuratorTemplate}
                isEditing={isEditing}
                isViewing={isViewing}
            />
        )
    } else {
        //if (!projects) return <LoadingPage />
        // if (projects.length === 0) // TODO <ErrorPage error={t('credentialsForm.error.noNamespacesFound')} />
        return (
            <AnsibleAutomationsForm
                ansibleCredentials={ansibleCredentials}
                clusterCurator={clusterCuratorTemplate}
                isEditing={false}
                isViewing={false}
            />
        )
    }
}

export function AnsibleAutomationsForm(props: {
    ansibleCredentials: ProviderConnection[]
    clusterCurator: ClusterCurator | undefined
    isEditing: boolean
    isViewing: boolean
}) {
    const { t } = useTranslation(['cluster', 'common', 'credentials'])
    const { ansibleCredentials, clusterCurator, isEditing, isViewing } = props

    const history = useHistory()

    // const [credentialsType, setCredentialsType] = useState(
    //     providerConnection?.metadata.labels?.['cluster.open-cluster-management.io/provider'] ?? ''
    // )
    const [templateName, setTemplateName] = useState('')
    const [ansibleSelection, setAnsibleSelection] = useState('')

    const [installPreJob, setInstallPreJob] = useState('')
    const [installPostJob, setInstallPostJob] = useState('')
    const [upgradePreJob, setUpgradePreJob] = useState('')
    const [upgradePostJob, setUpgradePostJob] = useState('')
    const [scalePreJob, setScalePreJob] = useState('')
    const [scalePostJob, setScalePostJob] = useState('')
    const [destroyPreJob, setDestroyPreJob] = useState('')
    const [destroyPostJob, setDestroyPostJob] = useState('')

    function stateToData() {
        let ansibleSecretNamespace = ''
        ansibleCredentials.forEach((credential) => {
            if (ansibleSelection === credential.metadata.name) ansibleSecretNamespace = credential.metadata!.namespace!
        })
        const curator: ClusterCurator = {
            apiVersion: ClusterCuratorApiVersion,
            kind: ClusterCuratorKind,
            metadata: {
                name: templateName,
                namespace: ansibleSecretNamespace,
            },
            spec: {
                install: {
                    towerAuthSecret: ansibleSelection,
                    prehook: [{ name: installPreJob }],
                    posthook: [{ name: installPostJob }],
                },
                upgrade: {
                    towerAuthSecret: ansibleSelection,
                    prehook: [{ name: upgradePreJob }],
                    posthook: [{ name: upgradePostJob }],
                },
                scale: {
                    towerAuthSecret: ansibleSelection,
                    prehook: [{ name: scalePreJob }],
                    posthook: [{ name: scalePostJob }],
                },
                destroy: {
                    towerAuthSecret: ansibleSelection,
                    prehook: [{ name: destroyPreJob }],
                    posthook: [{ name: destroyPostJob }],
                },
            },
        }

        return curator
    }

    const formData: FormData = {
        title: t('template.create.title'),
        titleTooltip: 'tooltip test',
        breadcrumb: [
            { text: t('template.title'), to: NavigationPath.ansibleAutomations },
            { text: t('template.create.title') },
        ],
        sections: [
            {
                title: t('template.template.information'),
                wizardTitle: t('template.create.config.wizard.title'),
                description: (
                    <TextContent>
                        <Grid>
                            <GridItem span={9}>
                                <Text component={TextVariants.small}>
                                    The default job templates that you select appear automatically during cluster
                                    creation when you select your-aws-cloud as the credential. To create a sequence of
                                    events, select multiple jobs. Drag and drop the job templates to reorder the
                                    sequence.
                                </Text>
                            </GridItem>
                        </Grid>
                    </TextContent>
                ),
                inputs: [
                    {
                        id: 'Template',
                        type: 'Text',
                        label: t('template.create.name'),
                        placeholder: t('template.create.placeholder'),
                        value: templateName,
                        onChange: setTemplateName,
                        isRequired: true,
                        isDisabled: isEditing,
                    },
                    {
                        id: 'ansibleSecrets',
                        type: 'Select',
                        label: t('credentials:credentialsForm.ansibleCredentials.label'),
                        placeholder: t('credentials:credentialsForm.ansibleCredentials.placeholder'),
                        value: ansibleSelection,
                        onChange: setAnsibleSelection,
                        isRequired: true,
                        options: () =>
                            ansibleCredentials.map((credential) => ({
                                id: credential.metadata.name as string,
                                value: credential.metadata.name as string,
                            })),
                        isDisplayLarge: true,
                        isDisabled: isEditing,
                    },
                ],
            },
            {
                title: t('template.create.install'),
                wizardTitle: t('template.create.install.wizard.title'),
                description: (
                    <TextContent>
                        <Grid>
                            <GridItem span={9}>
                                <Text component={TextVariants.small}></Text>
                            </GridItem>
                        </Grid>
                    </TextContent>
                ),

                inputs: [
                    {
                        id: 'installPreJob',
                        type: 'Text',
                        label: t('template.preInstall.label'),
                        placeholder: t('template.job.placeholder'),
                        value: installPreJob,
                        onChange: setInstallPreJob,
                    },
                    {
                        id: 'installPostJob',
                        type: 'Text',
                        label: t('template.postInstall.label'),
                        placeholder: t('template.job.placeholder'),
                        value: installPostJob,
                        onChange: setInstallPostJob,
                    },
                ],
            },
            {
                title: t('template.create.upgrade'),
                wizardTitle: t('template.create.upgrade.wizard.title'),
                description: (
                    <TextContent>
                        <Grid>
                            <GridItem span={9}>
                                <Text component={TextVariants.small}></Text>
                            </GridItem>
                        </Grid>
                    </TextContent>
                ),

                inputs: [
                    {
                        id: 'upgradePreJob',
                        type: 'Text',
                        label: t('template.preUpgrade.label'),
                        placeholder: t('template.job.placeholder'),
                        value: upgradePreJob,
                        onChange: setUpgradePreJob,
                    },
                    {
                        id: 'upgradePostJob',
                        type: 'Text',
                        label: t('template.postUpgrade.label'),
                        placeholder: t('template.job.placeholder'),
                        value: upgradePostJob,
                        onChange: setUpgradePostJob,
                    },
                ],
            },
            {
                title: t('template.create.scale'),
                wizardTitle: t('template.create.scale.wizard.title'),
                description: (
                    <TextContent>
                        <Grid>
                            <GridItem span={9}>
                                <Text component={TextVariants.small}></Text>
                            </GridItem>
                        </Grid>
                    </TextContent>
                ),

                inputs: [
                    {
                        id: 'scalePreJob',
                        type: 'Text',
                        label: t('template.preScale.label'),
                        placeholder: t('template.job.placeholder'),
                        value: scalePreJob,
                        onChange: setScalePreJob,
                    },
                    {
                        id: 'scalePostJob',
                        type: 'Text',
                        label: t('template.postScale.label'),
                        placeholder: t('template.job.placeholder'),
                        value: scalePostJob,
                        onChange: setScalePostJob,
                    },
                ],
            },
            {
                title: t('template.create.destroy'),
                wizardTitle: t('template.create.destroy.wizard.title'),
                description: (
                    <TextContent>
                        <Grid>
                            <GridItem span={9}>
                                <Text component={TextVariants.small}></Text>
                            </GridItem>
                        </Grid>
                    </TextContent>
                ),

                inputs: [
                    {
                        id: 'destroyPreJob',
                        type: 'Text',
                        label: t('template.preDestroy.label'),
                        placeholder: t('template.job.placeholder'),
                        value: destroyPreJob,
                        onChange: setDestroyPreJob,
                    },
                    {
                        id: 'destroyPostJob',
                        type: 'Text',
                        label: t('template.postDestroy.label'),
                        placeholder: t('template.job.placeholder'),
                        value: destroyPostJob,
                        onChange: setDestroyPostJob,
                    },
                ],
            },
        ],
        submit: () => {
            if (isEditing) {
                return replaceResource(stateToData() as IResource).promise.then(async () => {
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 4000))
                    history.push(NavigationPath.ansibleAutomations)
                })
            } else {
                return createResource(stateToData() as IResource).promise.then(async () => {
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 4000))
                    history.push(NavigationPath.ansibleAutomations)
                })
            }
        },
        submitText: isEditing ? t('common:save') : t('common:add'),
        submittingText: isEditing ? t('common:saving') : t('common:adding'),
        // TODO Cancel Text
        cancel: () => history.push(NavigationPath.ansibleAutomations),
    }

    return <AcmDataFormPage formData={formData} mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'} />
}
