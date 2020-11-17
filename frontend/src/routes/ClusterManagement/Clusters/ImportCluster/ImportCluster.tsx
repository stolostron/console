import {
    AcmAlert,
    AcmAlertGroup,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmSpinnerBackdrop,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, AlertVariant, Button, SelectOption } from '@patternfly/react-core'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { deleteResources } from '../../../../lib/delete-resources'
import { ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { createProject } from '../../../../resources/project'
import { IResource } from '../../../../resources/resource'

export default function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage>
            <AcmPageHeader title={t('page.header.import-cluster')} />
            <ImportClusterPageContent />
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const [clusterName, setClusterName] = useState<string>('')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)

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
            history.push(`/cluster-management/clusters/import/${clusterName}`)
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
            await Promise.allSettled(deleteResources(createdResources))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AcmPageCard>
            {loading && <AcmSpinnerBackdrop />}
            <AcmForm id="import-cluster-form">
                {error && (
                    <AcmAlertGroup>
                        <AcmAlert
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
                    onChange={(name) => setClusterName(name)}
                    placeholder={t('import.form.clusterName.placeholder')}
                    required
                />
                <AcmSelect
                    id="cloudLabel"
                    toggleId="cloudLabel-button"
                    label={t('import.form.cloud.label')}
                    value={cloudLabel}
                    onChange={(label) => setCloudLabel(label as string)}
                >
                    {['auto-detect', 'AWS', 'GCP', 'Azure', 'IBM', 'VMWare', 'Datacenter', 'Baremetal'].map((key) => (
                        <SelectOption key={key} value={key}>
                            {key}
                        </SelectOption>
                    ))}
                </AcmSelect>
                <AcmSelect
                    id="environmentLabel"
                    toggleId="environmentLabel-button"
                    label={t('import.form.environment.label')}
                    value={environmentLabel}
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
                <ActionGroup>
                    <Button id="submit" variant="primary" isDisabled={!clusterName} onClick={onSubmit}>
                        {t('import.form.submit')}
                    </Button>
                    <Button id="cancel" component="a" variant="link" href={NavigationPath.clusters}>
                        {t('common:cancel')}
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}
