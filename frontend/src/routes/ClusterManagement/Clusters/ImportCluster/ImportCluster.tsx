/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextArea,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Label, PageSection, SelectOption, Text } from '@patternfly/react-core'
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { Fragment, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { deleteResources } from '../../../../lib/delete-resources'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { createResource, ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { createProject } from '../../../../resources/project'
import { IResource } from '../../../../resources/resource'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import { useCanJoinClusterSets } from '../../ClusterSets/components/useCanJoinClusterSets'
import { ImportCommand, pollImportYamlSecret } from '../components/ImportCommand'

export default function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage
            header={
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
            }
        >
            <AcmPageContent id="import-cluster">
                <PageSection variant="light" isFilled>
                    <ImportClusterPageContent />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

enum ImportMode {
    manual,
    token,
    kubeconfig,
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const { canJoinClusterSets } = useCanJoinClusterSets()
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [importCommand, setImportCommand] = useState<string | undefined>()
    const [token, setToken] = useState<string | undefined>()
    const [server, setServer] = useState<string | undefined>()
    const [kubeConfig, setKubeConfig] = useState<string | undefined>()
    const [importMode, setImportMode] = useState<ImportMode>(ImportMode.manual)

    const onReset = () => {
        setClusterName('')
        setManagedClusterSet(undefined)
        setAdditionaLabels({})
        setSubmitted(false)
        setImportCommand(undefined)
    }

    return (
        <AcmAlertProvider>
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
                <AcmSelect
                    id="managedClusterSet"
                    label={t('import.form.managedClusterSet.label')}
                    placeholder={
                        canJoinClusterSets?.length === 0
                            ? t('import.no.cluster.sets.available')
                            : t('import.form.managedClusterSet.placeholder')
                    }
                    labelHelp={t('import.form.managedClusterSet.labelHelp')}
                    value={managedClusterSet}
                    onChange={(mcs) => setManagedClusterSet(mcs)}
                    isDisabled={canJoinClusterSets === undefined || canJoinClusterSets.length === 0 || submitted}
                    hidden={canJoinClusterSets === undefined}
                    helperText={
                        <Text component="small">
                            <Link to={NavigationPath.clusterSets}>{t('import.manage.cluster.sets')}</Link>
                        </Text>
                    }
                >
                    {canJoinClusterSets?.map((mcs) => (
                        <SelectOption key={mcs.metadata.name} value={mcs.metadata.name}>
                            {mcs.metadata.name}
                        </SelectOption>
                    ))}
                </AcmSelect>
                <AcmLabelsInput
                    id="additionalLabels"
                    label={t('import.form.labels.label')}
                    buttonLabel={t('common:label.add')}
                    value={additionalLabels}
                    onChange={(label) => setAdditionaLabels(label)}
                    placeholder={t('labels.edit.placeholder')}
                    isDisabled={submitted}
                />
                <AcmSelect
                    id="import-mode"
                    label={t('import.mode.select')}
                    placeholder={t('import.mode.default')}
                    value={
                        importMode === ImportMode.manual
                            ? t('import.mode.manual')
                            : importMode === ImportMode.token
                            ? t('import.mode.token')
                            : importMode === ImportMode.kubeconfig
                            ? t('import.mode.kubeconfig')
                            : ''
                    }
                    onChange={(value) => setImportMode(value as unknown as ImportMode)}
                    helperText={
                        importMode === ImportMode.manual
                            ? t('import.description')
                            : importMode === ImportMode.kubeconfig
                            ? t('import.credential.explanation')
                            : ''
                    }
                    isRequired
                >
                    <SelectOption key="manual-import" value={ImportMode.manual}>
                        {t('import.mode.manual')}
                    </SelectOption>
                    <SelectOption key="credentials" value={ImportMode.token}>
                        {t('import.mode.token')}
                    </SelectOption>
                    <SelectOption key="kubeconfig" value={ImportMode.kubeconfig}>
                        {t('import.mode.kubeconfig')}
                    </SelectOption>
                </AcmSelect>
                <AcmTextInput
                    id="server"
                    label={t('import.server')}
                    placeholder={t('import.server.place')}
                    value={server}
                    onChange={(server) => setServer(server)}
                    isRequired
                    hidden={importMode !== ImportMode.token}
                />
                <AcmTextInput
                    id="token"
                    label={t('import.token')}
                    placeholder={t('import.token.place')}
                    value={token}
                    onChange={(token) => setToken(token)}
                    isRequired
                    hidden={importMode !== ImportMode.token}
                />
                <AcmTextArea
                    id="kubeConfigEntry"
                    label={t('import.auto.config.label')}
                    placeholder={t('import.auto.config.prompt')}
                    value={kubeConfig}
                    onChange={(file) => setKubeConfig(file)}
                    hidden={importMode !== ImportMode.kubeconfig}
                    isRequired
                />
                <AcmAlertGroup isInline canClose padTop />
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={async () => {
                            setSubmitted(true)
                            alertContext.clearAlerts()
                            /* istanbul ignore next */
                            const clusterLabels: Record<string, string> = {
                                cloud: 'auto-detect',
                                vendor: 'auto-detect',
                                name: clusterName,
                                ...additionalLabels,
                            }
                            if (managedClusterSet) {
                                clusterLabels[managedClusterSetLabel] = managedClusterSet
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
                                    createdResources.push(
                                        await createManagedCluster({ clusterName, clusterLabels }).promise
                                    )
                                    createdResources.push(
                                        await createKlusterletAddonConfig({ clusterName, clusterLabels }).promise
                                    )

                                    if (importMode === ImportMode.kubeconfig) {
                                        createdResources.push(
                                            await createResource<Secret>({
                                                apiVersion: SecretApiVersion,
                                                kind: SecretKind,
                                                metadata: {
                                                    name: 'auto-import-secret',
                                                    namespace: clusterName,
                                                },
                                                stringData: {
                                                    autoImportRetry: '2',
                                                    kubeconfig: kubeConfig,
                                                },
                                                type: 'Opaque',
                                            } as Secret).promise
                                        )
                                            ? history.push(
                                                  NavigationPath.clusterDetails.replace(':id', clusterName as string)
                                              )
                                            : onReset()
                                    } else if (importMode === ImportMode.token) {
                                        createdResources.push(
                                            await createResource<Secret>({
                                                apiVersion: SecretApiVersion,
                                                kind: SecretKind,
                                                metadata: {
                                                    name: 'auto-import-secret',
                                                    namespace: clusterName,
                                                },
                                                stringData: {
                                                    autoImportRetry: '2',
                                                    token: token,
                                                    server: server,
                                                },
                                                type: 'Opaque',
                                            } as Secret).promise
                                        )
                                            ? history.push(
                                                  NavigationPath.clusterDetails.replace(':id', clusterName as string)
                                              )
                                            : onReset()
                                    } else {
                                        setImportCommand(await pollImportYamlSecret(clusterName))
                                    }
                                } catch (err) {
                                    if (err instanceof Error) {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: err.name,
                                            message: err.message,
                                        })
                                    }
                                    await deleteResources(createdResources).promise
                                    setSubmitted(false)
                                    reject()
                                } finally {
                                    resolve(undefined)
                                }
                            })
                        }}
                        label={
                            submitted
                                ? t('import.form.submitted')
                                : importMode === ImportMode.manual
                                ? t('import.form.submit')
                                : t('import.auto.button')
                        }
                        processingLabel={t('import.generating')}
                    />

                    {submitted ? (
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
                    <Fragment>
                        <ImportCommand importCommand={importCommand}>
                            <ActionGroup>
                                <Link to={NavigationPath.clusterDetails.replace(':id', clusterName as string)}>
                                    <Button variant="primary">{t('import.footer.viewcluster')}</Button>
                                </Link>
                                <AcmButton
                                    variant="secondary"
                                    role="link"
                                    onClick={() => {
                                        sessionStorage.getItem('DiscoveredClusterConsoleURL')
                                            ? history.push(NavigationPath.discoveredClusters)
                                            : onReset()
                                    }}
                                >
                                    {t('import.footer.importanother')}
                                </AcmButton>
                            </ActionGroup>
                        </ImportCommand>
                    </Fragment>
                )}
            </AcmForm>
        </AcmAlertProvider>
    )
}
