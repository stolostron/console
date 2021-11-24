/* Copyright Contributors to the Open Cluster Management project */

import {
    createKlusterletAddonConfig,
    createManagedCluster,
    createProject,
    createResource,
    IResource,
    managedClusterSetLabel,
    ResourceError,
    ResourceErrorCode,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../../../../../resources'
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
import { CheckCircleIcon } from '@patternfly/react-icons'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { Fragment, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
import { ImportCommand, pollImportYamlSecret } from '../components/ImportCommand'

export default function ImportClusterPage() {
    const { t } = useTranslation()
    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('Import an existing cluster')}
                    breadcrumb={[
                        { text: t('Managed clusters'), to: NavigationPath.clusters },
                        { text: t('Import an existing cluster'), to: '' },
                    ]}
                    titleTooltip={
                        <>
                            {t('Import clusters from different providers to manage them from this console.')}
                            <a
                                href={DOC_LINKS.IMPORT_CLUSTER}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('Learn more')}
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
    const { t } = useTranslation()
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterDisplayName') ?? '')
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [importSecret, setImportSecret] = useState<Secret | undefined>()
    const [token, setToken] = useState<string | undefined>()
    const [server, setServer] = useState<string | undefined>(sessionStorage.getItem('DiscoveredClusterApiURL') ?? '')
    const [kubeConfig, setKubeConfig] = useState<string | undefined>()
    const [importMode, setImportMode] = useState<ImportMode>(ImportMode.manual)
    const [discovered] = useState<boolean>(sessionStorage.getItem('DiscoveredClusterDisplayName') ? true : false)

    const onReset = () => {
        setClusterName('')
        setManagedClusterSet(undefined)
        setAdditionaLabels({})
        setSubmitted(false)
        setImportSecret(undefined)
    }

    return (
        <AcmAlertProvider>
            <AcmForm id="import-cluster-form">
                <AcmTextInput
                    id="clusterName"
                    label={t('Name')}
                    value={clusterName}
                    isDisabled={submitted}
                    onChange={(name) => setClusterName(name)}
                    placeholder={t('Enter cluster name')}
                    isRequired
                />
                <AcmSelect
                    id="managedClusterSet"
                    label={t('Cluster set')}
                    placeholder={
                        canJoinClusterSets?.length === 0 ? t('No cluster sets available') : t('Select a cluster set')
                    }
                    labelHelp={t(
                        'A ManagedClusterSet is a group of managed clusters. With a ManagedClusterSet, you can manage access to all of the managed clusters in the group together.'
                    )}
                    value={managedClusterSet}
                    onChange={(mcs) => setManagedClusterSet(mcs)}
                    isDisabled={canJoinClusterSets === undefined || canJoinClusterSets.length === 0 || submitted}
                    hidden={canJoinClusterSets === undefined}
                    helperText={
                        <Text component="small">
                            <Link to={NavigationPath.clusterSets}>{t('Manage cluster sets')}</Link>
                        </Text>
                    }
                    isRequired={mustJoinClusterSet}
                >
                    {canJoinClusterSets?.map((mcs) => (
                        <SelectOption key={mcs.metadata.name} value={mcs.metadata.name}>
                            {mcs.metadata.name}
                        </SelectOption>
                    ))}
                </AcmSelect>
                <AcmLabelsInput
                    id="additionalLabels"
                    label={t('Additional labels')}
                    buttonLabel={t('Add label')}
                    value={additionalLabels}
                    onChange={(label) => setAdditionaLabels(label)}
                    placeholder={t('Enter key=value, then press enter, space, or comma')}
                    isDisabled={submitted}
                />
                <AcmSelect
                    id="import-mode"
                    label={t('Import mode')}
                    placeholder={t('Select an import option for your existing cluster')}
                    value={
                        importMode === ImportMode.manual
                            ? t('Run import commands manually')
                            : importMode === ImportMode.token
                            ? t('Enter your server URL and API token for the existing cluster')
                            : importMode === ImportMode.kubeconfig
                            ? t('Kubeconfig')
                            : ''
                    }
                    onChange={(value) => setImportMode(value as unknown as ImportMode)}
                    helperText={
                        importMode === ImportMode.manual
                            ? t(
                                  'Once you click on "Save import and generate code", the information you entered is used to generate the code and cannot be modified anymore. If you wish to change any information, you will have to delete and re-import this cluster.'
                              )
                            : importMode === ImportMode.kubeconfig
                            ? t(
                                  "You need the kubeconfig file for the cluster that you're importing. Import information is used one time and is not saved."
                              )
                            : ''
                    }
                    isRequired
                >
                    <SelectOption key="manual-import" value={ImportMode.manual}>
                        {t('Run import commands manually')}
                    </SelectOption>
                    <SelectOption key="credentials" value={ImportMode.token}>
                        {t('Enter your server URL and API token for the existing cluster')}
                    </SelectOption>
                    <SelectOption key="kubeconfig" value={ImportMode.kubeconfig}>
                        {t('Kubeconfig')}
                    </SelectOption>
                </AcmSelect>
                <AcmTextInput
                    id="server"
                    label={t('Server URL')}
                    placeholder={t('Enter your server URL')}
                    value={server}
                    onChange={(server) => setServer(server)}
                    isRequired
                    hidden={importMode !== ImportMode.token}
                />
                <AcmTextInput
                    id="token"
                    label={t('API Token')}
                    placeholder={t('Enter your API token')}
                    value={token}
                    onChange={(token) => setToken(token)}
                    isRequired
                    hidden={importMode !== ImportMode.token}
                />
                <AcmTextArea
                    id="kubeConfigEntry"
                    label={t('Kubeconfig')}
                    placeholder={t('Copy and paste your kubeconfig content')}
                    value={kubeConfig}
                    onChange={(file) => setKubeConfig(file)}
                    hidden={importMode !== ImportMode.kubeconfig}
                    isRequired
                />
                <AcmAlertGroup isInline canClose />
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        isDisabled={
                            !clusterName ||
                            submitted ||
                            (importMode === ImportMode.kubeconfig && !kubeConfig) ||
                            (importMode === ImportMode.token && (!server || !token))
                        }
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
                            let clusterAnnotations: Record<string, string> = {}
                            if (discovered) {
                                clusterAnnotations = {
                                    'open-cluster-management/created-via': 'discovery',
                                }
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
                                        await createManagedCluster({ clusterName, clusterLabels, clusterAnnotations })
                                            .promise
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
                                        setImportSecret(await pollImportYamlSecret(clusterName))
                                    }
                                } catch (err) {
                                    if (err instanceof Error) {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: err.name,
                                            message: err.message,
                                        })
                                    }
                                    setSubmitted(false)
                                    reject()
                                } finally {
                                    resolve(undefined)
                                }
                            })
                        }}
                        label={
                            submitted
                                ? t('Code generated successfully')
                                : importMode === ImportMode.manual
                                ? t('Save import and generate code')
                                : t('Import')
                        }
                        processingLabel={t('import.generating')}
                    />

                    {submitted ? (
                        <Label variant="outline" color="blue" icon={<CheckCircleIcon />}>
                            {t('Import saved')}
                        </Label>
                    ) : (
                        <Link to={NavigationPath.clusters} id="cancel">
                            <Button variant="link">{t('Cancel')}</Button>
                        </Link>
                    )}
                </ActionGroup>
                {importSecret && (
                    <Fragment>
                        <ImportCommand importSecret={importSecret}>
                            <ActionGroup>
                                <Link to={NavigationPath.clusterDetails.replace(':id', clusterName as string)}>
                                    <Button variant="primary">{t('View cluster')}</Button>
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
                                    {t('Import another')}
                                </AcmButton>
                            </ActionGroup>
                        </ImportCommand>
                    </Fragment>
                )}
            </AcmForm>
        </AcmAlertProvider>
    )
}
