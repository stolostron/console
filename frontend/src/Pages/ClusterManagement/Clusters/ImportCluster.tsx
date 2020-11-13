import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import {
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
    AcmAlert,
    AcmAlertGroup,
    AcmSpinnerBackdrop,
    AcmExpandableSection,
    AcmHeader,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, SelectOption, AlertVariant, Card, CardTitle, CardBody, Tile, CardFooter, Label } from '@patternfly/react-core'
import CodeIcon from '@patternfly/react-icons/dist/js/icons/code-icon'
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createManagedCluster } from '../../../library/resources/managed-cluster'
import { createKlusterletAddonConfig } from '../../../library/resources/klusterlet-add-on-config'
import { createProject } from '../../../library/resources/project'
import { NavigationPath } from '../ClusterManagement'
import { AxiosResponse } from 'axios'
import { deleteCreatedResources } from '../../../library/utils/resource-methods'
import { ImportCommandPageContent } from '../Clusters/ImportCommand'


export function ImportClusterPage() {
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
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [errors, setErrors] = useState<AxiosResponse[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [submitted, submitForm] = useState<boolean>(false)


    const onSubmit = async () => {
        setLoading(true)
        /* istanbul ignore next */
        const clusterLabels = {
            cloud: cloudLabel ?? '',
            vendor: 'auto-detect',
            name: clusterName,
            environment: environmentLabel ?? '',
            ...additionalLabels
        }
        const projectResponse = await createProject(clusterName)
        let errors = []
        if (projectResponse.status === 201 || projectResponse.status === 409) {
            const response = await Promise.all([
                createKlusterletAddonConfig({ clusterName, clusterLabels }),
                createManagedCluster({ clusterName, clusterLabels }),
            ])
            /* istanbul ignore next */
            errors = response.filter((res) => res.status < 200 || res.status >= 300) ?? []
            errors.length > 0 && (await deleteCreatedResources(response))
        } else {
            errors.push(projectResponse)
        }

        if (errors.length > 0) {
            setErrors(errors)
            setLoading(false)
        } else {
            setLoading(false)
            submitForm(true)
        }
    }

    return (
        <AcmPageCard>
            {loading && <AcmSpinnerBackdrop />}
            <AcmExpandableSection label={t('import.form.header')} expanded={true}>
                <AcmForm id="import-cluster-form">
                    {errors.length > 0 && (
                        <AcmAlertGroup>
                            {errors.map((error: AxiosResponse) => (
                                <AcmAlert
                                    variant={AlertVariant.danger}
                                    title={t('common:request.failed')}
                                    subtitle={`${error.data.code}: ${error.data.message}`}
                                    key={error.data.message}
                                />
                            ))}
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
                        label={t('import.form.cloud.label')}
                        value={cloudLabel}
                        isDisabled={submitted}
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
                    <ActionGroup>
                        <Button id="submit" variant="primary" isDisabled={(!clusterName || submitted)} onClick={(onSubmit)}>
                            {t('import.form.submit')}
                        </Button>
                        { submitted ? 
                            <Label variant="outline" color="blue" icon={<CheckCircleIcon />}>{t('import.importmode.importsaved')}</Label> : 
                            <Button
                                id="cancel"
                                component="a"
                                variant="link"
                                href={NavigationPath.clusters}>{t('common:cancel')}            
                            </Button>
                        }
                    </ActionGroup>
                </AcmForm>
            </AcmExpandableSection>
            {/* <AcmExpandableSection label={t('import.importmode.header')} expanded={true}>
                <Card>
                    <CardTitle>{t('import.importmode.subheader')}</CardTitle>
                    <CardBody>{t('import.importmode.body')}</CardBody>
                    <CardFooter>
                        <Tile id="importModeManual" title={t('import.importmode.footer')} icon={<CodeIcon />} isSelected></Tile>
                    </CardFooter>
                </Card>
            </AcmExpandableSection> */}

            <br></br>
            { submitted ? <ImportCommandPageContent clusterName={clusterName} /> : null }
        </AcmPageCard>
    )
}
