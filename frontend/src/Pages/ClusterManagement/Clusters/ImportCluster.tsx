import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import {
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
    AcmCodeSnippet
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Title } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createManagedCluster } from '../../../lib/ManagedCluster'
import { createKlusterletAddonConfig } from '../../../lib/KlusterletAddonConfig'
import { secrets } from '../../../lib/Secret'
import { createProject } from '../../../lib/Project'
import { NavigationPath } from '../ClusterManagement'
import { AxiosResponse } from 'axios'

export function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    const [showCommandPage, setShowCommandPage] = useState<boolean>(false)
    return (
        <AcmPage>
            <AcmPageHeader title={t('page.header.import-cluster')} />
            <ImportClusterPageContent showCommandPage={showCommandPage} setShowCommandPage={setShowCommandPage} />
        </AcmPage>
    )
}

export function ImportClusterPageContent(props: {
    showCommandPage: boolean;
    setShowCommandPage: (value: boolean) => void
}) {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const [clusterName, setClusterName] = useState<string>('')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<string[] | undefined>([])
    const [importCommand, setImportCommand] = useState<string>('')
    const [errors, setErrors] = useState<any>()
errors && console.log('errors', errors)
    const onSubmit = async () => {
        const clusterLabels = { cloud: cloudLabel ?? '', vendor: 'auto-detect', name: clusterName, environment: environmentLabel ?? '' }
        const projectResponse = await createProject(clusterName)
        let errors = []
        if (projectResponse.status === 200 || projectResponse.status === 409) {
            const response = await Promise.all([
                createKlusterletAddonConfig({ clusterName, clusterLabels}),
                createManagedCluster({ clusterName, clusterLabels })
            ])
            response.forEach(res => (res.status < 200 || res.status >= 300) && errors.push(res))
            // response.forEach(res => {
            //     if (res.status < 200 || res.status >= 300) {
            //         errors.push(res)
            //     }
            // })
        } else {
            errors.push(projectResponse)
        }
        
        if (!errors.length) {
            const secret = await pollImportYamlSecret(clusterName) as AxiosResponse
            if (secret.status === 200) {
                const klusterletCRD = secret.data.data['crds.yaml']
                const importYaml = secret.data.data['import.yaml']
                setImportCommand(`echo ${klusterletCRD} | base64 --decode | kubectl apply -f - && sleep 2 && echo ${importYaml} | base64 --decode | kubectl apply -f -`)
                props.setShowCommandPage(true)
            } else {
                errors.push(secret)
            }
        }

        return errors.length > 0 && setErrors(errors)
    }
    if (props.showCommandPage) {
        return (
            <AcmPageCard>
                <Title headingLevel="h2">{t('import.command.generated')}</Title>
                <AcmCodeSnippet id="import-command" fakeCommand={t('import.command.fake')} command={importCommand} copyTooltipText="Copy to clipboard" copySuccessText="Copied!" />
            </AcmPageCard>
        )
    }
    return (
        <AcmPageCard>
            <AcmForm>
                <AcmTextInput
                    id="clusterName"
                    label={t('import.form.clusterName.label')}
                    value={clusterName}
                    onChange={(name) => setClusterName(name ?? '')}
                    placeholder={t('import.form.clusterName.placeholder')}
                    required
                />
                <AcmSelect
                    id="cloudLabel"
                    label={t('import.form.cloud.label')}
                    value={cloudLabel}
                    onChange={(label) => setCloudLabel(label ?? '')}
                    options={['auto-detect', 'AWS', 'GCP', 'Azure', 'IBM', 'VMWare', 'Datacenter', 'Baremetal']}
                />
                <AcmSelect
                    id="environmentLabel"
                    label={t('import.form.environment.label')}
                    value={environmentLabel}
                    onChange={setEnvironmentLabel}
                    options={['dev', 'prod', 'qa']}
                    placeholder={t('import.form.environment.placeholder')}
                />
                <AcmLabelsInput
                    id="additionalLabels"
                    label={t('import.form.labels.label')}
                    buttonLabel="Add label"
                    value={additionalLabels}
                    onChange={(label) => setAdditionaLabels(label)}
                />
                <ActionGroup>
                    <Button variant="primary" isDisabled={!clusterName} onClick={onSubmit}>
                        {t('import.form.submit')}
                    </Button>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.clusters)
                        }}
                    >
                        {t('common:cancel')}
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}

async function pollImportYamlSecret(clusterName: string) {
    let count = 0
    let importYamlSecret: AxiosResponse

    const poll = async (resolve: any, reject: any) => {
        importYamlSecret = await secrets.getNamespaceResource(clusterName, `${clusterName}-import`)
        console.log('importYamlSecret', importYamlSecret)
        if (importYamlSecret.status === 404 && count < 10) {
            count += 1
            setTimeout(poll, 500, resolve, reject)
        } else {
            return resolve(importYamlSecret)
        }
    }
    return new Promise(poll)
}
