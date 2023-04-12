/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  Switch,
  Text,
} from '@patternfly/react-core'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import {
  AcmButton,
  AcmKubernetesLabelsInput,
  AcmPage,
  AcmPageHeader,
  AcmSelect,
  AcmToastContext,
} from '../../../../../ui-components'
import { cloneDeep, groupBy, pick } from 'lodash'
import { Dispatch, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useState } from 'react'
import { generatePath, Link, useHistory } from 'react-router-dom'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  ClusterCuratorDefinition,
  ClusterCuratorKind,
  createClusterCurator,
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
  SecretDefinition,
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
  useSetHasValue,
} from '@patternfly-labs/react-form-wizard'
import { TemplateLinkOut, TemplateSummaryExpandable } from '../../../../../components/TemplateSummaryModal'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { makeStyles } from '@mui/styles'
import { useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'
import { AutomationProviderHint } from '../../../../../components/AutomationProviderHint'
import { validateYAML } from '../../../../../lib/validation'
import { useWizardStrings } from '../../../../../lib/wizardStrings'

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
  templateName: string
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
  | ({ type: 'setTemplateName' } & Pick<State, 'templateName'>)
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
    templateName: '',
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
          (!Object.keys(state.kacDefaultLabels).includes(key) || state.kacDefaultLabels[key] !== action.labels[key])
      )
      return {
        ...state,
        kacManagedClusterSet,
        kacAdditionalLabels: pick(action.labels, kacAdditionalLabelKeys),
      }
    }
    case 'setTemplateName':
      return { ...state, templateName: action.templateName }
    case 'setToken':
      return state.importMode === ImportMode.token ? { ...state, token: action.token } : state
    case 'setServer':
      return state.importMode === ImportMode.token ? { ...state, server: action.server } : state
    case 'setKubeconfig':
      return state.importMode === ImportMode.kubeconfig ? { ...state, kubeconfig: action.kubeconfig } : state
  }
  return state
}

export default function ImportClusterPage() {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)
  const { isACMAvailable } = useContext(PluginContext)
  const history = useHistory()
  const { cancel } = useBackCancelNavigation()
  const { canJoinClusterSets } = useCanJoinClusterSets()
  const mustJoinClusterSet = useMustJoinClusterSet()
  const initialClusterName = sessionStorage.getItem('DiscoveredClusterDisplayName') ?? ''
  const initialServer = sessionStorage.getItem('DiscoveredClusterApiURL') ?? ''
  const [discovered] = useState<boolean>(!!initialClusterName)
  const [submitButtonText, setSubmitButtonText] = useState<string>()
  const [submittingButtonText, setSubmittingButtonText] = useState<string>()
  const [state, dispatch] = useReducer(reducer, getInitialState(initialClusterName, initialServer))

  const useStyles = makeStyles({
    description: {
      margin: '16px 0 16px 0',
    },
  })
  const classes = useStyles()

  useEffect(() => {
    if (state.importMode !== 'manual') {
      setSubmitButtonText(t('Import'))
      setSubmittingButtonText(t('Importing'))
    } else {
      setSubmitButtonText(t('Generate command'))
      setSubmittingButtonText(t('Generating'))
    }
  }, [state.importMode, t])

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
            setState: (labels: State['additionalLabels']) => dispatch({ type: 'computeKACAdditionalLabels', labels }),
          },
        ]
      : []),
  ]

  const [drawerExpanded, setDrawerExpanded] = useState(localStorage.getItem('yaml') === 'true')
  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((expanded) => {
      localStorage.setItem('yaml', (!expanded).toString())
      return !expanded
    })
  }, [])

  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Import cluster steps'),
    contentAriaLabel: t('Import cluster content'),
  })

  function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context

    return (
      <SyncEditor
        editorTitle={t('Import cluster YAML')}
        variant="toolbar"
        id="code-content"
        schema={isACMAvailable ? acmSchema : schema}
        resources={resources}
        secrets={['Secret.0.stringData.token', 'Secret.0.stringData.kubeconfig']}
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

  const pageTitle = t('page.header.import-cluster')

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={pageTitle}
          breadcrumb={[
            { text: t('Clusters'), to: NavigationPath.clusters },
            { text: pageTitle, to: '' },
          ]}
          titleTooltip={
            <>
              {pageTitle}
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
          switches={<Switch id="yaml-switch" label="YAML" isChecked={drawerExpanded} onChange={toggleDrawerExpanded} />}
        />
      }
    >
      <Wizard
        wizardStrings={translatedWizardStrings}
        title={t('page.header.import-cluster')}
        showHeader={false}
        showYaml={drawerExpanded}
        yamlEditor={getWizardSyncEditor}
        defaultData={defaultData}
        onSubmit={async (data: unknown) => {
          toastContext.clearAlerts()

          const resources = data as any[]
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

            const resourceGroups = groupBy(resources, 'kind')
            // create resources
            for (const kind of [ManagedClusterKind, KlusterletAddonConfigKind, ClusterCuratorKind, SecretKind]) {
              if (resourceGroups[kind]?.length) {
                for (const resource of resourceGroups[kind]) {
                  await (kind === ClusterCuratorKind ? createClusterCurator(resource) : createResource(resource))
                    .promise
                }
              }
            }
            toastContext.addAlert({
              title: t('success.create.created', [state.clusterName]),
              type: 'success',
              autoClose: true,
            })
            setTimeout(() => {
              history.push(
                generatePath(NavigationPath.clusterDetails, {
                  name: state.clusterName,
                  namespace: '~managed-cluster',
                })
              )
            }, 2000)
          } catch (err) {
            if (err instanceof Error) {
              toastContext.addAlert({
                type: 'danger',
                title: err.name,
                message: err.message,
              })
            } else {
              throw err
            }
          }
        }}
        onCancel={cancel(NavigationPath.clusters)}
        submitButtonText={submitButtonText}
        submittingButtonText={submittingButtonText}
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
                onValueChange={(clusterName: any) =>
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
                onValueChange={(managedClusterSet: any) =>
                  dispatch({
                    type: 'setManagedClusterSet',
                    managedClusterSet: (managedClusterSet as State['managedClusterSet']) ?? '',
                  })
                }
              />
            </WizItemSelector>
            <AdditionalLabels state={state} dispatch={dispatch} />
            <AutoImportControls state={state} dispatch={dispatch} />
          </Section>
        </Step>
        <Step label={t('Automation')} id="automation" autohide={false}>
          <Section
            label={t('Automation')}
            description={
              <>
                <div className={classes.description}>{t('template.clusterImport.info')}</div>
                <AutomationProviderHint component="hint" />
              </>
            }
            autohide={false}
          >
            <AutomationTemplate state={state} dispatch={dispatch} />
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
  const klusterletAddonConfig = resources.find(
    (item) => item.kind === KlusterletAddonConfigKind
  ) as KlusterletAddonConfig

  const syncLabels = useCallback(
    (defaults: Labels, clusterSet: string, labels: Labels) => {
      managedCluster.metadata.labels = {
        ...defaults,
        [managedClusterSetLabel]: clusterSet,
        ...labels,
      }
      if (!clusterSet) {
        delete managedCluster.metadata.labels[managedClusterSetLabel]
      }
      if (klusterletAddonConfig) {
        klusterletAddonConfig.spec.clusterLabels = {
          ...defaults,
          [managedClusterSetLabel]: clusterSet,
          ...labels,
        }
        if (!clusterSet) {
          delete klusterletAddonConfig.spec.clusterLabels[managedClusterSetLabel]
        }
      }
      dispatch({ type: 'setManagedClusterSet', managedClusterSet: clusterSet })
      dispatch({ type: 'setAdditionalLabels', additionalLabels: labels })
      update()
    },
    [dispatch, managedCluster, klusterletAddonConfig, update]
  )

  const onChangeAdditionalLabels = useCallback(
    (labels: Labels) => syncLabels(defaultLabels, managedClusterSet, labels),
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
    <AcmKubernetesLabelsInput
      id={controlId}
      label={controlLabel}
      value={additionalLabels}
      onChange={(labels) => onChangeAdditionalLabels(labels as Labels)}
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

  const getImportModeDescription = (m: ImportMode) => {
    switch (m) {
      case ImportMode.manual:
        return t('import.mode.manual')
      case ImportMode.token:
        return t('import.mode.token')
      case ImportMode.kubeconfig:
        return t('import.mode.kubeconfig')
    }
    return '-'
  }

  const onChangeImportMode = useCallback(
    (m) => {
      const secretIndex = resources.findIndex((item) => item.kind === 'Secret' && item?.metadata?.name === secretName)
      const deleteCount = secretIndex >= 0 ? 1 : 0
      switch (m) {
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
      dispatch({ type: 'setImportMode', importMode: m })
      update()
    },
    [autoImportSecret, dispatch, kubeconfig, resources, server, token, update]
  )

  const validateKubeconfig = useCallback((value: string) => validateYAML(value, t), [t])

  const controlId = 'import-mode'
  const controlLabel = t('import.mode.select')
  return (
    <>
      {mode === DisplayMode.Details ? (
        <DescriptionListGroup>
          <DescriptionListTerm>{controlLabel}</DescriptionListTerm>
          <DescriptionListDescription id={controlId}>{getImportModeDescription(importMode)}</DescriptionListDescription>
        </DescriptionListGroup>
      ) : (
        <AcmSelect
          id={controlId}
          label={controlLabel}
          placeholder={t('import.mode.default')}
          value={importMode}
          onChange={onChangeImportMode}
          helperText={importMode === ImportMode.manual ? t('import.description') : t('import.credential.explanation')}
          isRequired
        >
          {Object.values(ImportMode).map((m) => {
            return (
              <SelectOption key={m} value={m}>
                {getImportModeDescription(m)}
              </SelectOption>
            )
          })}
        </AcmSelect>
      )}
      <Sync kind={ManagedClusterKind} path="metadata.name" targetKind={SecretKind} targetPath="metadata.namespace" />
      <Sync kind={ManagedClusterKind} path="metadata.name" targetKind={ClusterCuratorKind} targetPath="metadata.name" />
      <Sync
        kind={ManagedClusterKind}
        path="metadata.name"
        targetKind={ClusterCuratorKind}
        targetPath="metadata.namespace"
      />
      <WizItemSelector selectKey="metadata.name" selectValue={secretName}>
        <WizTextInput
          id="server"
          path="stringData.server"
          label={t('import.server')}
          placeholder={t('import.server.place')}
          onValueChange={(s: any) => dispatch({ type: 'setServer', server: (s as State['server']) ?? '' })}
          required={importMode === ImportMode.token}
          hidden={() => importMode !== ImportMode.token}
        />
        <WizTextInput
          id="token"
          path="stringData.token"
          label={t('import.token')}
          placeholder={t('import.token.place')}
          onValueChange={(t: any) => dispatch({ type: 'setToken', token: (t as State['token']) ?? '' })}
          secret
          required={importMode === ImportMode.token}
          hidden={() => importMode !== ImportMode.token}
        />
        <WizTextArea
          id="kubeConfigEntry"
          path="stringData.kubeconfig"
          label={t('import.auto.config.label')}
          placeholder={t('import.auto.config.prompt')}
          onValueChange={(k: any) => dispatch({ type: 'setKubeconfig', kubeconfig: (k as State['kubeconfig']) ?? '' })}
          secret
          validation={validateKubeconfig}
          required={importMode === ImportMode.kubeconfig}
          hidden={() => importMode !== ImportMode.kubeconfig}
        />
      </WizItemSelector>
    </>
  )
}

const AutomationTemplate = (props: { state: State; dispatch: Dispatch<Action> }) => {
  const { t } = useTranslation()
  const { ansibleCredentialsValue, clusterCuratorSupportedCurationsValue, validClusterCuratorTemplatesValue } =
    useSharedSelectors()
  const curatorTemplates = useRecoilValue(validClusterCuratorTemplatesValue)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const ansibleCredentials = useRecoilValue(ansibleCredentialsValue)
  const resources = useItem() as any[]
  const mode = useDisplayMode()
  const { update } = useData()
  const {
    state: { clusterName, templateName },
    dispatch,
  } = props
  const [selectedTemplateName, setSelectedTemplateName] = useState<ClusterCurator | undefined>()

  const setHasValue = useSetHasValue()
  useLayoutEffect(() => {
    if (templateName) {
      setHasValue()
    }
  }, [setHasValue, templateName])

  const onChangeAutomationTemplate = useCallback(
    (template) => {
      // Delete any previously generated YAML
      const curatorIndex = resources.findIndex(
        (item) => item.kind === ClusterCuratorKind && item?.metadata?.name === clusterName
      )
      if (curatorIndex >= 0) {
        resources.splice(curatorIndex, 1)
      }
      supportedCurations.forEach((curationType) => {
        const index = resources.findIndex(
          (item) => item.kind === SecretKind && item?.metadata?.name === `toweraccess-${curationType}`
        )
        if (index >= 0) {
          resources.splice(curatorIndex, 1)
        }
      })

      // Add new YAML for ClusterCurator and secrets
      const curatorTemplate = template ? curatorTemplates.find((cct) => cct.metadata.name === template) : undefined

      if (curatorTemplate) {
        setSelectedTemplateName(curatorTemplate)
        const curator = {
          ...ClusterCuratorDefinition,
          metadata: {
            name: clusterName,
            namespace: clusterName,
          },
          spec: cloneDeep(curatorTemplate.spec),
        }
        resources.push(curator)
        supportedCurations.forEach((curationType) => {
          const curation = curator.spec?.[curationType]
          if (curation?.towerAuthSecret) {
            const matchingSecret = ansibleCredentials.find(
              (s) =>
                s.metadata.name === curatorTemplate.spec?.[curationType]?.towerAuthSecret &&
                s.metadata.namespace === curatorTemplate.metadata.namespace
            )
            if (matchingSecret && matchingSecret.metadata.name && matchingSecret.metadata.namespace) {
              const secretName = `toweraccess-${curationType}`
              const copiedSecret = {
                ...SecretDefinition,
                type: 'Opaque',
                metadata: {
                  name: secretName,
                  namespace: clusterName,
                  labels: {
                    'cluster.open-cluster-management.io/type': 'ans',
                    'cluster.open-cluster-management.io/copiedFromSecretName': matchingSecret.metadata.name,
                    'cluster.open-cluster-management.io/copiedFromNamespace': matchingSecret.metadata.namespace,
                    'cluster.open-cluster-management.io/backup': 'cluster',
                  },
                },
                stringData: cloneDeep(matchingSecret.stringData),
              }
              curation.towerAuthSecret = secretName
              resources.push(copiedSecret)
            }
          }
        })
      }
      setSelectedTemplateName(curatorTemplate)
      dispatch({ type: 'setTemplateName', templateName: template })
      update()
    },
    [ansibleCredentials, clusterName, curatorTemplates, dispatch, resources, supportedCurations, update]
  )

  const controlId = 'templateName'
  const controlLabel = t('template.clusterCreate.name')
  return mode === DisplayMode.Details ? (
    <DescriptionListGroup>
      <DescriptionListTerm>{controlLabel}</DescriptionListTerm>
      <DescriptionListDescription id={controlId}>{templateName}</DescriptionListDescription>
    </DescriptionListGroup>
  ) : (
    <>
      <AcmSelect
        id={controlId}
        label={controlLabel}
        placeholder={t('template.clusterCreate.select.placeholder')}
        labelHelp={t('template.clusterImport.tooltip')}
        variant={SelectVariant.typeahead}
        helperText={
          <Split>
            <SplitItem isFilled />
            <SplitItem>
              <AcmButton
                variant="link"
                style={{ paddingRight: '0px' }}
                onClick={() =>
                  window.open(
                    `${window.location.origin}${NavigationPath.addAnsibleAutomation}`,
                    'add-automation-template'
                  )
                }
              >
                {t('creation.ocp.cloud.add.template')}
                <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </AcmButton>
            </SplitItem>
          </Split>
        }
        value={templateName}
        onChange={onChangeAutomationTemplate}
      >
        {Object.values(curatorTemplates).map((template) => {
          const templateName = template.metadata.name
          return (
            <SelectOption key={templateName} value={templateName}>
              {templateName}
            </SelectOption>
          )
        })}
      </AcmSelect>
      <TemplateLinkOut templateCurator={selectedTemplateName} />
      <TemplateSummaryExpandable clusterCurator={resources.find((r) => r.kind === ClusterCuratorKind)} />
    </>
  )
}
