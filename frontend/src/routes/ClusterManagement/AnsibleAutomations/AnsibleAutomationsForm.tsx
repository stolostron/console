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
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
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
    const { t } = useTranslation(['cluster', 'common', 'credentials', 'create'])
    const { ansibleCredentials, clusterCurator, isEditing, isViewing } = props

    const history = useHistory()

    const [templateName, setTemplateName] = useState(clusterCurator?.metadata.name ?? '')
    const [ansibleSelection, setAnsibleSelection] = useState(clusterCurator?.spec?.install?.towerAuthSecret ?? '')
    const [installPreJobs, setInstallPreJobs] = useState(
        clusterCurator?.spec?.install?.prehook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [installPostJobs, setInstallPostJobs] = useState(
        clusterCurator?.spec?.install?.posthook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [upgradePreJobs, setUpgradePreJobs] = useState(
        clusterCurator?.spec?.upgrade?.prehook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [upgradePostJobs, setUpgradePostJobs] = useState(
        clusterCurator?.spec?.upgrade?.posthook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [scalePreJobs, setScalePreJobs] = useState(
        clusterCurator?.spec?.scale?.prehook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [scalePostJobs, setScalePostJobs] = useState(
        clusterCurator?.spec?.scale?.posthook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [destroyPreJobs, setDestroyPreJobs] = useState(
        clusterCurator?.spec?.destroy?.prehook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const [destroyPostJobs, setDestroyPostJobs] = useState(
        clusterCurator?.spec?.destroy?.posthook?.map((ansibleJob) => ansibleJob.name) ?? []
    )
    const resourceVersion: string | undefined = clusterCurator?.metadata.resourceVersion ?? undefined

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
                resourceVersion: resourceVersion,
            },
            spec: {
                install: {
                    towerAuthSecret: ansibleSelection,
                    prehook: installPreJobs.map((name) => ({ name })),
                    posthook: installPostJobs.map((name) => ({ name })),
                },
                upgrade: {
                    towerAuthSecret: ansibleSelection,
                    prehook: upgradePreJobs.map((name) => ({ name })),
                    posthook: upgradePostJobs.map((name) => ({ name })),
                },
                scale: {
                    towerAuthSecret: ansibleSelection,
                    prehook: scalePreJobs.map((name) => ({ name })),
                    posthook: scalePostJobs.map((name) => ({ name })),
                },
                destroy: {
                    towerAuthSecret: ansibleSelection,
                    prehook: destroyPreJobs.map((name) => ({ name })),
                    posthook: destroyPostJobs.map((name) => ({ name })),
                },
            },
        }
        return curator
    }

    const formData: FormData = {
        title: t('create:template.create.title'),
        titleTooltip: 'tooltip test',
        breadcrumb: [
            { text: t('template.title'), to: NavigationPath.ansibleAutomations },
            { text: t('create:template.create.title') },
        ],
        reviewDescription: t('template.create.review.description'),
        reviewTitle: t('template.create.review.title'),
        cancelLabel: t('common:cancel'),
        nextLabel: t('common:next'),
        backLabel: t('common:back'),
        sections: [
            {
                type: 'Section',
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
                        options: ansibleCredentials.map((credential) => ({
                            id: credential.metadata.name as string,
                            value: credential.metadata.name as string,
                        })),
                        isDisabled: isEditing,
                    },
                ],
            },
            {
                type: 'SectionGroup',
                title: t('template.templates.title'),
                sections: [
                    {
                        type: 'Section',
                        title: t('template.create.install'),
                        wizardTitle: t('template.create.install.wizard.title'),
                        inputs: [
                            {
                                id: 'installPreJob',
                                type: 'OrderedStrings',
                                label: t('template.preInstall.label'),
                                placeholder: t('template.job.placeholder'),
                                value: installPreJobs,
                                onChange: setInstallPreJobs,
                            },
                            {
                                id: 'installPostJob',
                                type: 'OrderedStrings',
                                label: t('template.postInstall.label'),
                                placeholder: t('template.job.placeholder'),
                                value: installPostJobs,
                                onChange: setInstallPostJobs,
                            },
                        ],
                    },
                    {
                        type: 'Section',
                        title: t('template.create.upgrade'),
                        wizardTitle: t('template.create.upgrade.wizard.title'),
                        inputs: [
                            {
                                id: 'upgradePreJob',
                                type: 'OrderedStrings',
                                label: t('template.preUpgrade.label'),
                                placeholder: t('template.job.placeholder'),
                                value: upgradePreJobs,
                                onChange: setUpgradePreJobs,
                            },
                            {
                                id: 'upgradePostJob',
                                type: 'OrderedStrings',
                                label: t('template.postUpgrade.label'),
                                placeholder: t('template.job.placeholder'),
                                value: upgradePostJobs,
                                onChange: setUpgradePostJobs,
                            },
                        ],
                    },
                    {
                        type: 'Section',
                        title: t('template.create.scale'),
                        wizardTitle: t('template.create.scale.wizard.title'),
                        inputs: [
                            {
                                id: 'scalePreJob',
                                type: 'OrderedStrings',
                                label: t('template.preScale.label'),
                                placeholder: t('template.job.placeholder'),
                                value: scalePreJobs,
                                onChange: setScalePreJobs,
                            },
                            {
                                id: 'scalePostJob',
                                type: 'OrderedStrings',
                                label: t('template.postScale.label'),
                                placeholder: t('template.job.placeholder'),
                                value: scalePostJobs,
                                onChange: setScalePostJobs,
                            },
                        ],
                    },
                    {
                        type: 'Section',
                        title: t('template.create.destroy'),
                        wizardTitle: t('template.create.destroy.wizard.title'),
                        inputs: [
                            {
                                id: 'destroyPreJob',
                                type: 'OrderedStrings',
                                label: t('template.preDestroy.label'),
                                placeholder: t('template.job.placeholder'),
                                value: destroyPreJobs,
                                onChange: setDestroyPreJobs,
                            },
                            {
                                id: 'destroyPostJob',
                                type: 'OrderedStrings',
                                label: t('template.postDestroy.label'),
                                placeholder: t('template.job.placeholder'),
                                value: destroyPostJobs,
                                onChange: setDestroyPostJobs,
                            },
                        ],
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
        cancel: () => history.push(NavigationPath.ansibleAutomations),
        stateToData,
    }

    return <AcmDataFormPage formData={formData} mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'} />
}
