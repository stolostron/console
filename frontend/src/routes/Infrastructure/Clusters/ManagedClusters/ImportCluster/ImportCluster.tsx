/* Copyright Contributors to the Open Cluster Management project */
import {
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    SelectOption,
    Switch,
    Text,
} from '@patternfly/react-core'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { AcmLabelsInput, AcmPage, AcmPageHeader, AcmSelect, AcmToastContext } from '../../../../../ui-components'
import { cloneDeep, keyBy, pick } from 'lodash'
import { Dispatch, useCallback, useContext, useLayoutEffect, useMemo, useReducer, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { CancelBackState, cancelNavigation, NavigationPath } from '../../../../../NavigationPath'
import {
    createProject,
    createResource,
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
    ManagedCluster,
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
import schema from './schema.json'
import kac from './kac.json'
import {
    DisplayMode,
    Section,
    Step,
    Sync,
    useData,
    useDisplayMode,
    useItem,
    Wizard,
    WizItemSelector,
    WizSingleSelect,
    WizTextArea,
    WizTextInput,
} from '@patternfly-labs/react-form-wizard'

const acmSchema = [...schema, ...kac]

enum ImportMode {
    manual = 'manual',
    token = 'token',
    kubeconfig = 'kubeconfig',
}

function escapePath(key: string) {
    return key.replace(/\./g, '\\.')
}

type Labels = Record<string, string>

type State = {
    clusterName: string
    importMode: ImportMode
    defaultLabels: Labels
    managedClusterSet: string
    additionalLabels: Labels
    kacDefaultLabels: Labels
    kacManagedClusterSet: string
    kacAdditionalLabels: Labels
    token: string
    server: string
    kubeconfig: string
}

type Action =
    | ({ type: 'setClusterName' } & Pick<State, 'clusterName'>)
    | ({ type: 'setImportMode' } & Pick<State, 'importMode'>)
    | ({ type: 'setManagedClusterSet' } & Pick<State, 'managedClusterSet'>)
    | ({ type: 'setAdditionalLabels' } & Pick<State, 'additionalLabels'>)
    | { type: 'computeAdditionalLabels'; labels: State['additionalLabels'] }
    | { type: 'computeKACAdditionalLabels'; labels: State['kacAdditionalLabels'] }
    | ({ type: 'setToken' } & Pick<State, 'token'>)
    | ({ type: 'setServer' } & Pick<State, 'server'>)
    | ({ type: 'setKubeconfig' } & Pick<State, 'kubeconfig'>)

const getInitialState = (initialClusterName: State['clusterName'], initialServer: State['server']): State => {
    const defaultLabels = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: initialClusterName,
    }
    return {
        clusterName: initialClusterName,
        importMode: ImportMode.manual,
        defaultLabels,
        managedClusterSet: '',
        additionalLabels: {},
        kacDefaultLabels: defaultLabels,
        kacManagedClusterSet: '',
        kacAdditionalLabels: {},
        token: '',
        server: initialServer,
        kubeconfig: '',
    }
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setClusterName':
            return {
                ...state,
                clusterName: action.clusterName,
                defaultLabels: { ...state.defaultLabels, name: action.clusterName },
                kacDefaultLabels: { ...state.kacDefaultLabels, name: action.clusterName },
            }
        case 'setImportMode':
            return { ...state, importMode: action.importMode }
        case 'setManagedClusterSet':
            return {
                ...state,
                managedClusterSet: action.managedClusterSet,
                kacManagedClusterSet: action.managedClusterSet,
            }
        case 'setAdditionalLabels':
            return { ...state, additionalLabels: action.additionalLabels, kacAdditionalLabels: action.additionalLabels }
        case 'computeAdditionalLabels': {
            // Update cluster set
            const managedClusterSet = action.labels?.[managedClusterSetLabel] ?? ''
            // Additonal labels excludes the ManagedClusterSet label and any unchanged default labels
            // Changed default labels get added to additional labels to shadow the defaults
            const additionalLabelKeys = Object.keys(action.labels).filter(
                (key) =>
                    key !== managedClusterSetLabel &&
                    (!Object.keys(state.defaultLabels).includes(key) || state.defaultLabels[key] !== action.labels[key])
            )
            return {
                ...state,
                managedClusterSet,
                additionalLabels: pick(action.labels, additionalLabelKeys),
            }
        }
        case 'computeKACAdditionalLabels': {
            // Update cluster set
            const kacManagedClusterSet = action.labels?.[managedClusterSetLabel] ?? ''
            // Additonal labels excludes the ManagedClusterSet label and any unchanged default labels
            // Changed default labels get added to additional labels to shadow the defaults
            const kacAdditionalLabelKeys = Object.keys(action.labels).filter(
                (key) =>
                    key !== managedClusterSetLabel &&
                    (!Object.keys(state.kacDefaultLabels).includes(key) ||
                        state.kacDefaultLabels[key] !== action.labels[key])
            )
            return {
                ...state,
                kacManagedClusterSet,
                kacAdditionalLabels: pick(action.labels, kacAdditionalLabelKeys),
            }
        }
        case 'setToken':
            return state.importMode === ImportMode.token ? { ...state, token: action.token } : state
        case 'setServer':
            return state.importMode === ImportMode.token ? { ...state, server: action.server } : state
        case 'setKubeconfig':
            return state.importMode === ImportMode.kubeconfig ? { ...state, kubeconfig: action.kubeconfig } : state
    }
}

export default function ImportClusterPage() {
    const { t } = useTranslation()
    const toastContext = useContext(AcmToastContext)
    const { isACMAvailable } = useContext(PluginContext)
    const history = useHistory()
    const location = useLocation<CancelBackState>()
    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    const initialClusterName = sessionStorage.getItem('DiscoveredClusterDisplayName') ?? ''
    const initialServer = sessionStorage.getItem('DiscoveredClusterApiURL') ?? ''
    const [discovered] = useState<boolean>(!!initialClusterName)

    const [state, dispatch] = useReducer(reducer, getInitialState(initialClusterName, initialServer))

    const defaultData = useMemo(() => {
        const clusterAnnotations: Record<string, string> = {}
        if (discovered) {
            clusterAnnotations['open-cluster-management/created-via'] = 'discovery'
        }
        const resources = []
        resources.push({
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: initialClusterName,
                labels: state.defaultLabels,
                annotations: clusterAnnotations,
            },
            spec: { hubAcceptsClient: true },
        })
        if (isACMAvailable) {
            resources.push({
                apiVersion: KlusterletAddonConfigApiVersion,
                kind: KlusterletAddonConfigKind,
                metadata: { name: initialClusterName, namespace: initialClusterName },
                spec: {
                    clusterName: initialClusterName,
                    clusterNamespace: initialClusterName,
                    clusterLabels: { ...state.kacDefaultLabels },
                    applicationManager: { enabled: true, argocdCluster: false },
                    policyController: { enabled: true },
                    searchCollector: { enabled: true },
                    certPolicyController: { enabled: true },
                    iamPolicyController: { enabled: true },
                },
            })
        }
        return resources
    }, [discovered, initialClusterName, isACMAvailable, state.defaultLabels, state.kacDefaultLabels])

    const syncs = [
        {
            path: 'ManagedCluster[0].metadata.name',
            setState: (clusterName: State['clusterName']) => dispatch({ type: 'setClusterName', clusterName }),
        },
        {
            path: 'ManagedCluster[0].metadata.labels',
            setState: (labels: State['additionalLabels']) => dispatch({ type: 'computeAdditionalLabels', labels }),
        },
        {
            path: 'Secret[0].stringData.server',
            setState: (server: State['server']) => dispatch({ type: 'setServer', server }),
        },
        {
            path: 'Secret[0].stringData.token',
            setState: (token: State['token']) => dispatch({ type: 'setToken', token }),
        },
        {
            path: 'Secret[0].stringData.kubeconfig',
            setState: (kubeconfig: State['kubeconfig']) => dispatch({ type: 'setKubeconfig', kubeconfig }),
        },
        ...(isACMAvailable
            ? [
                  {
                      path: 'KlusterletAddonConfig[0].spec.clusterLabels',
                      setState: (labels: State['additionalLabels']) =>
                          dispatch({ type: 'computeKACAdditionalLabels', labels }),
                  },
              ]
            : []),
    ]

    const [drawerExpanded, setDrawerExpanded] = useState(localStorage.getItem('yaml') === 'true')
    const toggleDrawerExpanded = useCallback(() => {
        setDrawerExpanded((drawerExpanded) => {
            localStorage.setItem('yaml', (!drawerExpanded).toString())
            return !drawerExpanded
        })
    }, [])

    function WizardSyncEditor() {
        const { isACMAvailable } = useContext(PluginContext)
        const resources = useItem() // Wizard framework sets this context
        const { update } = useData() // Wizard framework sets this context

        return (
            <SyncEditor
                editorTitle={t('Import cluster YAML')}
                variant="toolbar"
                id="code-content"
                schema={isACMAvailable ? acmSchema : schema}
                resources={resources}
                secrets={['*.stringData.token', '*.stringData.kubeconfig']}
                syncs={syncs}
                onEditorChange={(changes: { resources: any[] }): void => {
                    update(changes?.resources)
                }}
            />
        )
    }

    function getWizardSyncEditor() {
        return <WizardSyncEditor />
    }

    return (
        <AcmPage
            header={
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
                        <Switch
                            id="yaml-switch"
                            label="YAML"
                            isChecked={drawerExpanded}
                            onChange={toggleDrawerExpanded}
                        />
                    }
                />
            }
        >
            <Wizard
                title={t('page.header.import-cluster')}
                showHeader={false}
                showYaml={drawerExpanded}
                yamlEditor={getWizardSyncEditor}
                defaultData={defaultData}
                onSubmit={function (data: unknown): Promise<void> {
                    toastContext.clearAlerts()

                    const resources = data as any[]

                    return new Promise(async (resolve, reject) => {
                        try {
                            // create the project
                            try {
                                await createProject(state.clusterName).promise
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

                            // create Secret
                            if (resourceMap['Secret']) {
                                await createResource(resourceMap['Secret']).promise
                            }
                            history.push(NavigationPath.clusterDetails.replace(':id', state.clusterName))
                        } catch (err) {
                            if (err instanceof Error) {
                                toastContext.addAlert({
                                    type: 'danger',
                                    title: err.name,
                                    message: err.message,
                                })
                            } else {
                                reject()
                            }
                        } finally {
                            resolve(undefined)
                        }
                    })
                }}
                onCancel={function (): void {
                    cancelNavigation(location, history, NavigationPath.clusters)
                }}
            >
                <Step label={t('Details')} id="details">
                    <Section label={t('Details')}>
                        <Sync
                            kind={ManagedClusterKind}
                            targetKind={KlusterletAddonConfigKind}
                            path="metadata.name"
                            targetPath="metadata.name"
                        />
                        <Sync
                            kind={ManagedClusterKind}
                            targetKind={KlusterletAddonConfigKind}
                            path="metadata.name"
                            targetPath="metadata.namespace"
                        />
                        <Sync
                            kind={ManagedClusterKind}
                            targetKind={KlusterletAddonConfigKind}
                            path="metadata.name"
                            targetPath="spec.clusterName"
                        />
                        <Sync
                            kind={ManagedClusterKind}
                            targetKind={KlusterletAddonConfigKind}
                            path="metadata.name"
                            targetPath="spec.clusterNamespace"
                        />
                        <WizItemSelector selectKey="kind" selectValue={ManagedClusterKind}>
                            <WizTextInput
                                id="clusterName"
                                path="metadata.name"
                                label={t('import.form.clusterName.label')}
                                placeholder={t('import.form.clusterName.placeholder')}
                                required
                                onValueChange={(clusterName) =>
                                    dispatch({
                                        type: 'setClusterName',
                                        clusterName: (clusterName as State['clusterName']) ?? '',
                                    })
                                }
                            />
                            <WizSingleSelect
                                id="managedClusterSet"
                                path={`metadata.labels.${escapePath(managedClusterSetLabel)}`}
                                label={t('import.form.managedClusterSet.label')}
                                placeholder={
                                    canJoinClusterSets?.length === 0
                                        ? t('import.no.cluster.sets.available')
                                        : t('import.form.managedClusterSet.placeholder')
                                }
                                helperText={
                                    <Text component="small">
                                        <Link to={NavigationPath.clusterSets}>{t('import.manage.cluster.sets')}</Link>
                                    </Text>
                                }
                                disabled={canJoinClusterSets === undefined || canJoinClusterSets.length === 0}
                                hidden={() => canJoinClusterSets === undefined}
                                required={mustJoinClusterSet}
                                options={canJoinClusterSets?.map((mcs) => mcs.metadata.name as string) || []}
                                onValueChange={(managedClusterSet) =>
                                    dispatch({
                                        type: 'setManagedClusterSet',
                                        managedClusterSet: (managedClusterSet as string) ?? '',
                                    })
                                }
                            />
                        </WizItemSelector>
                        <AdditionalLabels state={state} dispatch={dispatch} />
                        <AutoImportControls state={state} dispatch={dispatch} />
                    </Section>
                </Step>
            </Wizard>
        </AcmPage>
    )
}

const AdditionalLabels = (props: { state: State; dispatch: Dispatch<Action> }) => {
    const {
        state: {
            defaultLabels,
            managedClusterSet,
            kacDefaultLabels,
            additionalLabels,
            kacManagedClusterSet,
            kacAdditionalLabels,
        },
        dispatch,
    } = props
    const { t } = useTranslation()
    const resources = useItem() as any[]
    const { update } = useData()
    const mode = useDisplayMode()

    const managedCluster = resources.find((item) => item.kind === ManagedClusterKind) as ManagedCluster
    const kac = resources.find((item) => item.kind === KlusterletAddonConfigKind) as KlusterletAddonConfig

    const syncLabels = useCallback(
        (defaultLabels: Labels, managedClusterSet: string, additionalLabels: Labels) => {
            managedCluster.metadata.labels = {
                ...defaultLabels,
                [managedClusterSetLabel]: managedClusterSet,
                ...additionalLabels,
            }
            if (!managedClusterSet) {
                delete managedCluster.metadata.labels[managedClusterSetLabel]
            }
            if (kac) {
                kac.spec.clusterLabels = {
                    ...defaultLabels,
                    [managedClusterSetLabel]: managedClusterSet,
                    ...additionalLabels,
                }
                if (!managedClusterSet) {
                    delete kac.spec.clusterLabels[managedClusterSetLabel]
                }
            }
            dispatch({ type: 'setManagedClusterSet', managedClusterSet })
            dispatch({ type: 'setAdditionalLabels', additionalLabels })
            update()
        },
        [dispatch, managedCluster, kac, update]
    )

    const onChangeAdditionalLabels = useCallback(
        (additionalLabels: Labels) => syncLabels(defaultLabels, managedClusterSet, additionalLabels),
        [defaultLabels, managedClusterSet, syncLabels]
    )

    useLayoutEffect(() => {
        syncLabels(defaultLabels, managedClusterSet, additionalLabels)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(additionalLabels), managedClusterSet, JSON.stringify(defaultLabels)])

    useLayoutEffect(() => {
        syncLabels(kacDefaultLabels, kacManagedClusterSet, kacAdditionalLabels)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(kacAdditionalLabels), kacManagedClusterSet, JSON.stringify(kacDefaultLabels)])

    const controlId = 'additionalLabels'
    const controlLabel = t('import.form.labels.label')
    return mode === DisplayMode.Details ? (
        <DescriptionListGroup>
            <DescriptionListTerm>{controlLabel}</DescriptionListTerm>
            <DescriptionListDescription id={controlId}>
                {additionalLabels &&
                    Object.keys(additionalLabels)
                        .map((key) => (additionalLabels[key] ? `${key}=${additionalLabels[key]}` : key))
                        .join(', ')}
            </DescriptionListDescription>
        </DescriptionListGroup>
    ) : (
        <AcmLabelsInput
            id={controlId}
            label={controlLabel}
            buttonLabel={t('label.add')}
            value={additionalLabels}
            onChange={(additionalLabels) => onChangeAdditionalLabels(additionalLabels as Labels)}
            placeholder={t('labels.edit.placeholder')}
        />
    )
}

const AutoImportControls = (props: { state: State; dispatch: Dispatch<Action> }) => {
    const {
        state: { clusterName, importMode, kubeconfig, server, token },
        dispatch,
    } = props
    const { t } = useTranslation()
    const secretName = 'auto-import-secret'
    const resources = useItem() as any[]
    const { update } = useData()
    const mode = useDisplayMode()

    const autoImportSecret = useMemo(
        (): Secret => ({
            apiVersion: SecretApiVersion,
            kind: SecretKind,
            metadata: {
                name: secretName,
                namespace: clusterName,
            },
            stringData: {
                autoImportRetry: '2',
            },
            type: 'Opaque',
        }),
        [clusterName]
    )

    const getImportModeDescription = (mode: ImportMode) => {
        switch (mode) {
            case ImportMode.manual:
                return t('import.mode.manual')
            case ImportMode.token:
                return t('import.mode.token')
            case ImportMode.kubeconfig:
                return t('import.mode.kubeconfig')
        }
    }

    const onChangeImportMode = useCallback(
        (importMode) => {
            const secretIndex = resources.findIndex(
                (item) => item.kind === 'Secret' && item?.metadata?.name === secretName
            )
            const deleteCount = secretIndex >= 0 ? 1 : 0
            switch (importMode) {
                case ImportMode.manual:
                    // Delete auto-import secret
                    if (deleteCount) {
                        resources.splice(secretIndex, 1)
                    }
                    break
                case ImportMode.kubeconfig: {
                    // Insert/Replace auto-import secret
                    const kubeconfigSecret = cloneDeep(autoImportSecret)
                    kubeconfigSecret.stringData = { ...kubeconfigSecret.stringData, kubeconfig }
                    resources.splice(deleteCount ? secretIndex : 1, deleteCount, kubeconfigSecret)
                    break
                }
                case ImportMode.token: {
                    // Insert/Replace auto-import secret
                    const tokenSecret = cloneDeep(autoImportSecret)
                    tokenSecret.stringData = { ...tokenSecret.stringData, token, server }
                    resources.splice(deleteCount ? secretIndex : 1, deleteCount, tokenSecret)
                    break
                }
            }
            dispatch({ type: 'setImportMode', importMode })
            update()
        },
        [autoImportSecret, dispatch, kubeconfig, resources, server, token, update]
    )

    const controlId = 'import-mode'
    const controlLabel = t('import.mode.select')
    return (
        <>
            {mode === DisplayMode.Details ? (
                <DescriptionListGroup>
                    <DescriptionListTerm>{controlLabel}</DescriptionListTerm>
                    <DescriptionListDescription id={controlId}>
                        {getImportModeDescription(importMode)}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            ) : (
                <AcmSelect
                    id={controlId}
                    label={controlLabel}
                    placeholder={t('import.mode.default')}
                    value={importMode}
                    onChange={onChangeImportMode}
                    helperText={
                        importMode === ImportMode.manual ? t('import.description') : t('import.credential.explanation')
                    }
                    isRequired
                >
                    {Object.values(ImportMode).map((mode) => {
                        return (
                            <SelectOption key={mode} value={mode}>
                                {getImportModeDescription(mode)}
                            </SelectOption>
                        )
                    })}
                </AcmSelect>
            )}
            <Sync
                kind={ManagedClusterKind}
                path="metadata.name"
                targetKind={SecretKind}
                targetPath="metadata.namespace"
            />
            <WizItemSelector selectKey="metadata.name" selectValue={secretName}>
                <WizTextInput
                    id="server"
                    path="stringData.server"
                    label={t('import.server')}
                    placeholder={t('import.server.place')}
                    onValueChange={(server) =>
                        dispatch({ type: 'setServer', server: (server as State['server']) ?? '' })
                    }
                    required
                    hidden={() => importMode !== ImportMode.token}
                />
                <WizTextInput
                    id="token"
                    path="stringData.token"
                    label={t('import.token')}
                    placeholder={t('import.token.place')}
                    onValueChange={(token) => dispatch({ type: 'setToken', token: (token as State['token']) ?? '' })}
                    secret
                    required
                    hidden={() => importMode !== ImportMode.token}
                />
                <WizTextArea
                    id="kubeConfigEntry"
                    path="stringData.kubeconfig"
                    label={t('import.auto.config.label')}
                    placeholder={t('import.auto.config.prompt')}
                    onValueChange={(kubeconfig) =>
                        dispatch({ type: 'setKubeconfig', kubeconfig: (kubeconfig as State['kubeconfig']) ?? '' })
                    }
                    secret
                    required
                    hidden={() => importMode !== ImportMode.kubeconfig}
                />
            </WizItemSelector>
        </>
    )
}
