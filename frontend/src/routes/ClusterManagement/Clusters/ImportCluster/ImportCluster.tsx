import {
    AcmAlert,
    AcmAlertGroup,
    AcmExpandableSection,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmSpinnerBackdrop,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, AlertVariant, Button, Label, SelectOption, Text, TextVariants } from '@patternfly/react-core'
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { deleteResources } from '../../../../lib/delete-resources'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { createProject } from '../../../../resources/project'
import { IResource } from '../../../../resources/resource'
import { ImportCommandPageContent } from '../ImportCommand/ImportCommand'

export default function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage>
            <AcmPageHeader
                title={t('page.header.import-cluster')}
                breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }]}
            />
            <ImportClusterPageContent />
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)
    const [submitted, submitForm] = useState<boolean>(false)

    const onReset = () => {
        setClusterName('')
        setCloudLabel('auto-detect')
        setEnvironmentLabel(undefined)
        setAdditionaLabels({})
        submitForm(false)
    }

    const onSubmit = async () => {
        setLoading(true)
        /* istanbul ignore next */
        const clusterLabels = {
            cloud: cloudLabel ?? '',
            vendor: 'auto-detect',
            name: clusterName,
            environment: environmentLabel ?? '',
            ...additionalLabels,
        }
        const createdResources: IResource[] = []
        setError(undefined)
        try {
            try {
                createdResources.push(await createProject(clusterName).promise)
            } catch (err) {
                const resourceError = err as ResourceError
                if (resourceError.code !== ResourceErrorCode.Conflict) {
                    throw err
                }
            }
            createdResources.push(await createManagedCluster({ clusterName, clusterLabels }).promise)
            createdResources.push(await createKlusterletAddonConfig({ clusterName, clusterLabels }).promise)
            setLoading(false)
            submitForm(true)
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'ResourceError') {
                    const resourceError = err as ResourceError
                    setError(resourceError.message)
                } else {
                    setError(err.message)
                }
            } else {
                setError('Unknown error occurred.')
            }
            await deleteResources(createdResources).promise
        } finally {
            setLoading(false)
        }
    }

    return (
        <AcmPageCard>
            {loading && <AcmSpinnerBackdrop />}
            <AcmExpandableSection label={t('import.form.header')} expanded={true}>
                <AcmForm id="import-cluster-form">
                    {error && (
                        <AcmAlertGroup>
                            <AcmAlert
                                isInline
                                variant={AlertVariant.danger}
                                title={t('common:request.failed')}
                                subtitle={error}
                                key={error}
                            />
                        </AcmAlertGroup>
                    )}

                    <AcmTextInput
                        id="clusterName"
                        label={t('import.form.clusterName.label')}
                        value={clusterName}
                        isDisabled={submitted}
                        onChange={(name) => setClusterName(name)}
                        placeholder={t('import.form.clusterName.placeholder')}
                        required
                    />
                    <AcmSelect
                        id="cloudLabel"
                        toggleId="cloudLabel-button"
                        isDisabled={submitted}
                        label={t('import.form.cloud.label')}
                        value={cloudLabel}
                        onChange={(label) => setCloudLabel(label as string)}
                    >
                        {['auto-detect', 'AWS', 'GCP', 'Azure', 'IBM', 'VMWare', 'Datacenter', 'Baremetal'].map(
                            (key) => (
                                <SelectOption key={key} value={key}>
                                    {key}
                                </SelectOption>
                            )
                        )}
                    </AcmSelect>
                    <AcmSelect
                        id="environmentLabel"
                        toggleId="environmentLabel-button"
                        label={t('import.form.environment.label')}
                        value={environmentLabel}
                        isDisabled={submitted}
                        onChange={setEnvironmentLabel}
                        placeholder={t('import.form.environment.placeholder')}
                    >
                        {['dev', 'prod', 'qa'].map((key) => (
                            <SelectOption key={key} value={key}>
                                {key}
                            </SelectOption>
                        ))}
                    </AcmSelect>
                    <AcmLabelsInput
                        id="additionalLabels"
                        label={t('import.form.labels.label')}
                        buttonLabel={t('common:label.add')}
                        value={additionalLabels}
                        onChange={(label) => setAdditionaLabels(label)}
                    />
                    <Text component={TextVariants.small}>{t('import.description')}</Text>
                    <ActionGroup>
                        <Button id="submit" variant="primary" isDisabled={!clusterName || submitted} onClick={onSubmit}>
                            {submitted ? t('import.form.submitted') : t('import.form.submit')}
                        </Button>
                        {submitted ? (
                            <Label variant="outline" color="blue" icon={<CheckCircleIcon />}>
                                {t('import.importmode.importsaved')}
                            </Label>
                        ) : (
                            <Button id="cancel" component="a" variant="link" href={NavigationPath.clusters}>
                                {t('common:cancel')}
                            </Button>
                        )}
                    </ActionGroup>
                    {!loading && submitted ? <ImportCommandPageContent clusterName={clusterName} /> : null}
                    {!loading && submitted ? (
                        <ActionGroup>
                            <Link to={NavigationPath.clusterDetails.replace(':id', clusterName as string)}>
                                <Button variant="primary">{t('import.footer.viewcluster')}</Button>
                            </Link>{' '}
                            {sessionStorage.getItem('DiscoveredClusterConsoleURL') ? (
                                <Link to={NavigationPath.discoveredClusters}>
                                    <Button variant="secondary">{t('import.footer.importanother')}</Button>
                                </Link>
                            ) : (
                                <Link to={NavigationPath.importCluster}>
                                    <Button onClick={onReset} variant="secondary">
                                        {t('import.footer.importanother')}
                                    </Button>
                                </Link>
                            )}
                        </ActionGroup>
                    ) : null}
                </AcmForm>
            </AcmExpandableSection>
        </AcmPageCard>
    )
}
