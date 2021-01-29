import React, { useState } from 'react'
import {
    AcmAlert,
    AcmExpandableSection,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmTextInput,
    AcmSubmit,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, AlertVariant, Label, Text, TextVariants } from '@patternfly/react-core'
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
import { DOC_LINKS } from '../../../../lib/doc-util'

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
                titleTooltip={
                    <>
                        {t('page.header.import-cluster.tooltip')}
                        <a
                            href={DOC_LINKS.IMPORT_CLUSTER}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', marginTop: '4px' }}
                        >
                            {t('common:learn.more')}
                        </a>
                    </>
                }
            />
            <ImportClusterPageContent />
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [error, setError] = useState<string | undefined>()
    const [loading, setLoading] = useState<boolean>(false)
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [importCommand, setImportCommand] = useState<string | undefined>()

    const onReset = () => {
        setClusterName('')
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
            cloud: 'auto-detect',
            vendor: 'auto-detect',
            name: clusterName,
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
                        isRequired
                    />
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
