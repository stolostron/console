import React, { useState } from 'react'
import {
    AcmAlert,
    AcmExpandableSection,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
    AcmSubmit,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, SelectOption, AlertVariant, Label, Text, TextVariants } from '@patternfly/react-core'
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { deleteResources } from '../../../../lib/delete-resources'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { createProject } from '../../../../resources/project'
import { IResource } from '../../../../resources/resource'
import { ImportCommand, pollImportYamlSecret } from '../components/ImportCommand'
import { useHistory } from 'react-router-dom'

export default function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage>
            <AcmPageHeader
                title={t('page.header.import-cluster')}
                breadcrumb={[
                    { text: t('clusters'), to: NavigationPath.clusters },
                    { text: t('page.header.import-cluster'), to: '' },
                ]}
            />
            <ImportClusterPageContent />
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [error, setError] = useState<string | undefined>()
    const [loading, setLoading] = useState<boolean>(false)
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [importCommand, setImportCommand] = useState<string | undefined>()

    const onReset = () => {
        setClusterName('')
        setCloudLabel('auto-detect')
        setEnvironmentLabel(undefined)
        setAdditionaLabels({})
        setSubmitted(false)
        setError(undefined)
        setImportCommand(undefined)
    }

    const onSubmit = async () => {
        setSubmitted(true)
        setLoading(true)
        setError(undefined)
        /* istanbul ignore next */
        const clusterLabels = {
            cloud: cloudLabel ?? '',
            vendor: 'auto-detect',
            name: clusterName,
            environment: environmentLabel ?? '',
            ...additionalLabels,
        }
        const createdResources: IResource[] = []
        return new Promise(async (resolve, reject) => {
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

                setImportCommand(await pollImportYamlSecret(clusterName))
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
                setSubmitted(false)
                reject()
            } finally {
                setLoading(false)
                resolve(undefined)
            }
        })
    }

    return (
        <AcmPageCard>
            <AcmExpandableSection label={t('import.form.header')} expanded={true}>
                <AcmForm id="import-cluster-form">
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
                        {['auto-detect', 'AWS', 'GCP', 'Azure', 'IBM', 'VMware', 'Datacenter', 'Baremetal'].map(
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
                    {error && (
                        <AcmAlert
                            isInline
                            variant={AlertVariant.danger}
                            title={t('common:request.failed')}
                            subtitle={error}
                            key={error}
                        />
                    )}
                    <ActionGroup>
                        <AcmSubmit
                            id="submit"
                            variant="primary"
                            isDisabled={!clusterName || submitted}
                            onClick={onSubmit}
                            label={submitted && !error ? t('import.form.submitted') : t('import.form.submit')}
                            processingLabel={t('import.generating')}
                        />
                        {submitted && !error ? (
                            <Label variant="outline" color="blue" icon={<CheckCircleIcon />}>
                                {t('import.importmode.importsaved')}
                            </Label>
                        ) : (
                            <Link to={NavigationPath.clusters} id="cancel">
                                <Button variant="link">{t('common:cancel')}</Button>
                            </Link>
                        )}
                    </ActionGroup>
                    {importCommand && (
                        <React.Fragment>
                            <ImportCommand importCommand={importCommand}>
                                {!loading && !error && (
                                    <ActionGroup>
                                        <Link to={NavigationPath.clusterDetails.replace(':id', clusterName as string)}>
                                            <Button variant="primary">{t('import.footer.viewcluster')}</Button>
                                        </Link>
                                        <AcmButton
                                            variant="secondary"
                                            component="a"
                                            onClick={() => {
                                                sessionStorage.getItem('DiscoveredClusterConsoleURL')
                                                    ? history.push(NavigationPath.discoveredClusters)
                                                    : onReset()
                                            }}
                                        >
                                            {t('import.footer.importanother')}
                                        </AcmButton>
                                    </ActionGroup>
                                )}
                            </ImportCommand>
                        </React.Fragment>
                    )}
                </AcmForm>
            </AcmExpandableSection>
        </AcmPageCard>
    )
}
