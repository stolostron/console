/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../../atoms'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData } from '../../../components/AcmFormData'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { createResource, replaceResource } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import {
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    getClusterCurator,
} from '../../../resources/cluster-curator'
import { ProviderConnection, unpackProviderConnection } from '../../../resources/provider-connection'
import { IResource } from '../../../resources/resource'

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
    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const [clusterCuratorTemplate, setClusterCuratorTemplate] = useState<ClusterCurator | undefined>()

    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/provider'] === 'ans'
    )
    useEffect(() => {
        if (isEditing || isViewing) {
            const result = getClusterCurator({ name, namespace })
            result.promise
                .then((curator) => {
                    setClusterCuratorTemplate(curator)
                })
                .catch(setError)
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
        // TODO: Can we create templates without an ansible secret linked?
        // Where do we store the template in this scenario?
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

    const [templateName, setTemplateName] = useState(clusterCurator?.metadata.name as string)
    const [ansibleSelection, setAnsibleSelection] = useState(clusterCurator?.spec?.install?.towerAuthSecret as string)

    const [installPreJob, setInstallPreJob] = useState(
        (clusterCurator?.spec?.install?.prehook?.[0].name as string) ?? ''
    )
    const [installPostJob, setInstallPostJob] = useState(
        (clusterCurator?.spec?.install?.posthook?.[0].name as string) ?? ''
    )
    const [upgradePreJob, setUpgradePreJob] = useState(
        (clusterCurator?.spec?.upgrade?.prehook?.[0].name as string) ?? ''
    )
    const [upgradePostJob, setUpgradePostJob] = useState(
        (clusterCurator?.spec?.upgrade?.posthook?.[0].name as string) ?? ''
    )
    const [scalePreJob, setScalePreJob] = useState((clusterCurator?.spec?.scale?.prehook?.[0].name as string) ?? '')
    const [scalePostJob, setScalePostJob] = useState((clusterCurator?.spec?.scale?.posthook?.[0].name as string) ?? '')
    const [destroyPreJob, setDestroyPreJob] = useState(
        (clusterCurator?.spec?.destroy?.prehook?.[0].name as string) ?? ''
    )
    const [destroyPostJob, setDestroyPostJob] = useState(
        (clusterCurator?.spec?.destroy?.posthook?.[0].name as string) ?? ''
    )

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
        reviewDescription: t('template.create.review.description'),
        reviewTitle: t('template.create.review.title'),
        cancelLabel: t('common:cancel'),
        nextLabel: t('common:next'),
        backLabel: t('common:back'),
        sections: [
            {
                title: t('template.information.title'),
                wizardTitle: t('template.create.config.wizard.title'),
                description: t('template.information.description'),
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
