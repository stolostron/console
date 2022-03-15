/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import {
    ActionGroup,
    Button,
    Drawer,
    DrawerColorVariant,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    FormGroup,
    Label,
    Page,
    PageSection,
    SelectOption,
    Switch,
    Text,
} from '@patternfly/react-core'
import { CheckCircleIcon } from '@patternfly/react-icons'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import useResizeObserver from '@react-hook/resize-observer'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmForm,
    AcmLabelsInput,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextArea,
    AcmTextInput,
} from '@stolostron/ui-components'
import { keyBy } from 'lodash'
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { SyncDiff, SyncDiffType } from '../../../../../components/SyncEditor/SyncDiff'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    createProject,
    createResource,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    managedClusterSetLabel,
    ResourceError,
    ResourceErrorCode,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../../../../../resources'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
import { ImportCommand, pollImportYamlSecret } from '../components/ImportCommand'
import schema from './schema.json'

const minWizardSize = 1000
const defaultPanelSize = 600
const EDITOR_CHANGES = 'Editor changes'

export default function ImportClusterPage() {
    const { t } = useTranslation()
    const pageRef = useRef(null)
    const [drawerExpanded, setDrawerExpanded] = useState(localStorage.getItem('import-cluster-yaml') === 'true')
    const [drawerMaxSize, setDrawerMaxSize] = useState<string | undefined>('1400px')

    useResizeObserver(pageRef, (entry) => {
        const inline = drawerExpanded && entry.contentRect.width > minWizardSize + defaultPanelSize
        setDrawerMaxSize(inline ? `${Math.round((entry.contentRect.width * 2) / 3)}px` : undefined)
    })

    const [importResources, setImportResources] = useState<any | undefined>([])
    function onFormChange(resources: any) {
        setImportResources(resources)
    }
    const [editorChanges, setEditorChanges] = useState<SyncDiffType>()

    return (
        <div ref={pageRef} style={{ height: '100%' }}>
            <Page
                additionalGroupedContent={
                    <Fragment>
                        <AcmPageHeader
                            title={t('page.header.import-cluster')}
                            breadcrumb={[
                                { text: t('Clusters'), to: NavigationPath.clusters },
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
                                        {t('Learn more')}
                                    </a>
                                </>
                            }
                            switches={
                                <Fragment>
                                    <Switch
                                        label="YAML"
                                        isChecked={drawerExpanded}
                                        onChange={() => {
                                            localStorage.setItem('import-cluster-yaml', (!drawerExpanded).toString())
                                            setDrawerExpanded(!drawerExpanded)
                                            setEditorChanges(undefined)
                                        }}
                                    />
                                </Fragment>
                            }
                        />
                    </Fragment>
                }
                groupProps={{ sticky: 'top' }}
            >
                <Drawer isExpanded={drawerExpanded} isInline={true}>
                    <DrawerContent
                        panelContent={
                            <DrawerPanelContent
                                isResizable={true}
                                defaultSize="600px"
                                maxSize={drawerMaxSize}
                                minSize="400px"
                                colorVariant={DrawerColorVariant.light200}
                            >
                                <SyncEditor
                                    variant="toolbar"
                                    id="code-content"
                                    editorTitle={t('import.cluster.yaml')}
                                    schema={schema}
                                    resources={importResources}
                                    onClose={(): void => {
                                        setDrawerExpanded(false)
                                    }}
                                    onEditorChange={(editorChanges: SyncDiffType): void => {
                                        setEditorChanges(editorChanges)
                                    }}
                                />
                            </DrawerPanelContent>
                        }
                    >
                        <DrawerContentBody>
                            <AcmPageContent id="import-cluster">
                                <PageSection variant="light" isFilled>
                                    <ImportClusterPageContent
                                        onFormChange={onFormChange}
                                        editorChanges={editorChanges}
                                    />
                                </PageSection>
                            </AcmPageContent>
                        </DrawerContentBody>
                    </DrawerContent>
                </Drawer>
            </Page>
        </div>
    )
}

enum ImportMode {
    manual,
    token,
    kubeconfig,
}

const ImportClusterPageContent: React.FC<any> = ({ onFormChange, editorChanges }) => {
    const { t } = useTranslation()
    const alertContext = useContext(AcmAlertContext)
    const { isACMAvailable } = useContext(PluginContext)
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
    const [importResources, setImportResources] = useState<any | undefined>([])

    useEffect(() => {
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
        const resources = []
        resources.push({
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: clusterName,
                labels: clusterLabels,
                annotations: clusterAnnotations,
            },
            spec: { hubAcceptsClient: true },
        })

        switch (importMode) {
            case ImportMode.kubeconfig:
                resources.push({
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
                })
                break
            case ImportMode.token:
                resources.push({
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
                })
        }
        if (isACMAvailable) {
            resources.push({
                apiVersion: KlusterletAddonConfigApiVersion,
                kind: KlusterletAddonConfigKind,
                metadata: { name: clusterName, namespace: clusterName },
                spec: {
                    clusterName: clusterName,
                    clusterNamespace: clusterName,
                    clusterLabels: { ...clusterLabels },
                    applicationManager: { enabled: true, argocdCluster: false },
                    policyController: { enabled: true },
                    searchCollector: { enabled: true },
                    certPolicyController: { enabled: true },
                    iamPolicyController: { enabled: true },
                },
            })
        }
        setImportResources(resources)
        onFormChange(resources)
    }, [
        importMode,
        discovered,
        clusterName,
        additionalLabels,
        kubeConfig,
        managedClusterSet,
        token,
        server,
        isACMAvailable,
    ])

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
                    label={t('import.form.labels.label')}
                    buttonLabel={t('label.add')}
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
                {editorChanges?.changes?.length > 0 && (
                    <FormGroup fieldId="diffs" label={t(EDITOR_CHANGES)}>
                        <SyncDiff editorChanges={editorChanges} errorMessage={'Resolve editor syntax errors.'} />
                    </FormGroup>
                )}
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

                            // creating pure form resources or form resources modified by editor
                            let resources = importResources
                            let createName = clusterName
                            if (editorChanges?.resources) {
                                resources = editorChanges?.resources
                                const managedCluster = resources.find(
                                    (resource: { kind: string }) => resource.kind === 'ManagedCluster'
                                )
                                createName = managedCluster?.metadata?.name ?? createName
                            }

                            /* istanbul ignore next */
                            return new Promise(async (resolve, reject) => {
                                try {
                                    // create the project
                                    try {
                                        await createProject(createName).promise
                                    } catch (err) {
                                        const resourceError = err as ResourceError
                                        if (resourceError.code !== ResourceErrorCode.Conflict) {
                                            throw err
                                        }
                                    }

                                    const resourceMap = keyBy(resources, 'kind')
                                    // create ManagedCluster
                                    if (resourceMap['ManagedCluster']) {
                                        await createResource(resourceMap['ManagedCluster']).promise
                                    }
                                    // create KlusterletAddonConfig
                                    if (resourceMap['KlusterletAddonConfig']) {
                                        await createResource(resourceMap['KlusterletAddonConfig']).promise
                                    }

                                    // open cluster page or import secret
                                    if (importMode === ImportMode.kubeconfig || importMode === ImportMode.token) {
                                        // create Secret
                                        if (resourceMap['Secret']) {
                                            await createResource(resourceMap['Secret']).promise
                                        }
                                        history.push(NavigationPath.clusterDetails.replace(':id', createName as string))
                                    } else {
                                        setImportSecret(await pollImportYamlSecret(createName))
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
                            <Button variant="link">{t('cancel')}</Button>
                        </Link>
                    )}
                </ActionGroup>
                {importSecret && (
                    <Fragment>
                        <ImportCommand importSecret={importSecret}>
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
