/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Split,
  SplitItem,
  Switch,
  Text,
} from '@patternfly/react-core'
import { SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import {
  AcmButton,
  AcmKubernetesLabelsInput,
  AcmPage,
  AcmPageHeader,
  AcmSelect,
  AcmToastContext,
} from '../../../../../ui-components'
import { cloneDeep, get, groupBy, isEqual, pick } from 'lodash'
import { Dispatch, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useState } from 'react'
import { Link, generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath, UNKNOWN_NAMESPACE, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  ClusterCuratorDefinition,
  ClusterCuratorKind,
  createClusterCurator,
  createProject,
  KlusterletAddonConfig,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  managedClusterSetLabel,
  ProviderConnection,
  ProviderConnectionStringData,
  Secret,
  SecretApiVersion,
  SecretDefinition,
  SecretKind,
} from '../../../../../resources'
import { createResource, ResourceError, ResourceErrorCode } from '../../../../../resources/utils'
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
import { useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'
import { AutomationProviderHint } from '../../../../../components/AutomationProviderHint'
import { validateYAML } from '../../../../../lib/validation'
import { useWizardStrings } from '../../../../../lib/wizardStrings'
import { css } from '@emotion/css'
import { AcmFormInputAdapter } from '../../../../../wizards/common/AcmFormInputAdapter'
import { usePrevious } from '../../../../../components/usePrevious'

const acmSchema = [...schema, ...kac]

enum ImportMode {
  manual = 'manual',
  token = 'token',
  kubeconfig = 'kubeconfig',
  discoveryOCM = 'discoveryOCM',
}

const isImportMode = (importMode?: string): importMode is ImportMode => {
  return !!importMode && (Object.values(ImportMode) as string[]).includes(importMode)
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
  templateName?: string
  token: string
  server: string
  kubeconfig: string
  clusterID: string
  discoveryCredentialName: string
  api_token: string
  namespace: string
  credentials: ProviderConnection[]
  credential: string
}

function getLabelsFromState(state: State) {
  return {
    ...state.defaultLabels,
    ...(state.managedClusterSet ? { [managedClusterSetLabel]: state.managedClusterSet } : {}),
    ...state.additionalLabels,
  }
}

type Action =
  | ({ type: 'setClusterName' } & Pick<State, 'clusterName'>)
  | ({ type: 'setImportMode' } & Pick<State, 'importMode'>)
  | ({ type: 'setManagedClusterSet' } & Pick<State, 'managedClusterSet'>)
  | ({ type: 'setAdditionalLabels' } & Pick<State, 'additionalLabels'>)
  | { type: 'computeAdditionalLabels'; labels: Labels; labelsKAC?: Labels }
  | ({ type: 'setTemplateName' } & Pick<State, 'templateName'>)
  | ({ type: 'setToken' } & Pick<State, 'token'>)
  | ({ type: 'setServer' } & Pick<State, 'server'>)
  | ({ type: 'setKubeconfig' } & Pick<State, 'kubeconfig'>)
  | ({ type: 'setClusterID' } & Pick<State, 'clusterID'>)
  | ({ type: 'setNamespace' } & Pick<State, 'namespace'>)
  | ({ type: 'setCredential' } & Pick<State, 'credential'>)
  | { type: 'updateCredentials' }

const AUTO_IMPORT_SECRET = 'auto-import-secret'

const getImportMode = (presetDiscoveredCluster: boolean, discoveryClusterType?: string) => {
  if (presetDiscoveredCluster) {
    if (discoveryClusterType === 'ROSA') {
      return ImportMode.discoveryOCM
    } else {
      return ImportMode.token
    }
  }
  return ImportMode.manual
}

function getCredentialsInNamespace(credentialList: ProviderConnection[] | undefined, namespace: string) {
  return credentialList?.filter((credential) => credential.metadata.namespace === namespace) ?? []
}

function getInitialState({
  initialClusterName,
  initialServer,
  initialClusterID,
  discoveryCredential,
  discoveryClusterType,
  initialAPIToken,
  credentialList,
}: {
  initialClusterName: State['clusterName']
  initialServer: State['server']
  initialClusterID: State['clusterID']
  discoveryCredential: State['discoveryCredentialName']
  discoveryClusterType?: string
  initialAPIToken?: string
  credentialList?: ProviderConnection[]
}): State {
  const defaultLabels = {
    cloud: 'auto-detect',
    vendor: 'auto-detect',
    name: initialClusterName,
  }
  const presetClusterInformation = !!initialClusterName
  let initialNamespace = ''
  let initialCredential = ''

  if (presetClusterInformation) {
    initialNamespace =
      credentialList?.find((credential) => credential.metadata.name === discoveryCredential)?.metadata.namespace ?? ''
    initialCredential =
      credentialList?.find((credential) => credential.metadata.name === discoveryCredential)?.metadata.name ?? ''
  }

  const credentials = getCredentialsInNamespace(credentialList, initialNamespace)

  return {
    clusterName: initialClusterName,
    importMode: getImportMode(presetClusterInformation, discoveryClusterType),
    defaultLabels,
    managedClusterSet: '',
    additionalLabels: {},
    templateName: '',
    token: '',
    server: initialServer,
    kubeconfig: '',
    clusterID: presetClusterInformation ? initialClusterID : '',
    discoveryCredentialName: discoveryCredential,
    api_token: initialAPIToken ?? '',
    namespace: initialNamespace,
    credentials,
    credential: initialCredential,
  }
}

const description = css({ margin: '16px 0 16px 0' })

// Helper function to check if the namespace exists
function doesNamespaceExist(ocmCredentials: ProviderConnection[], namespace: string): boolean {
  return ocmCredentials.some((credential) => credential.metadata.namespace === namespace)
}

// Helper function to filter credentials based on namespace
function getFilteredCredentials(ocmCredentials: ProviderConnection[], namespace: string): ProviderConnection[] {
  return ocmCredentials.filter((credential) => credential.metadata.namespace === namespace)
}

// Helper function to check if a credential exists within the filtered credentials
function doesCredentialExist(filteredCredentials: ProviderConnection[], credentialName: string): boolean {
  return filteredCredentials.some((credential) => credential.metadata.name === credentialName)
}

export default function ImportClusterPage() {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)
  const { isACMAvailable } = useContext(PluginContext)
  const navigate = useNavigate()
  const { cancel } = useBackCancelNavigation()
  const { canJoinClusterSets } = useCanJoinClusterSets()
  const mustJoinClusterSet = useMustJoinClusterSet()
  const discoveryType = sessionStorage.getItem('DiscoveryType') ?? ''
  const initialClusterName = sessionStorage.getItem('DiscoveredClusterDisplayName') ?? ''
  const initialServer = sessionStorage.getItem('DiscoveredClusterApiURL') ?? ''
  const [discovered] = useState<boolean>(!!initialClusterName)
  const [submitButtonText, setSubmitButtonText] = useState<string>()
  const [submittingButtonText, setSubmittingButtonText] = useState<string>()
  const { RHOCMCredentials } = useSharedSelectors()
  const ocmCredentials = useRecoilValue(RHOCMCredentials)
  let initialClusterID = ''
  let initialDiscoveryCredential = ''
  let initialStringData: ProviderConnectionStringData = {}
  if (discoveryType === 'ROSA') {
    initialClusterID = sessionStorage.getItem('DiscoveredClusterID') ?? ''
    initialDiscoveryCredential = sessionStorage.getItem('DiscoveryCredential') ?? ''
    initialStringData =
      ocmCredentials.find((cred) => cred.metadata.name === initialDiscoveryCredential)?.stringData ?? {}
  }
  const { auth_method: initialAuthMethod = 'offline-token' } = initialStringData
  const {
    ocmAPIToken: initialAPIToken = initialAuthMethod === 'offline-token' ? '' : undefined,
    client_id: initialClientID,
    client_secret: initialClientSecret,
  } = initialStringData

  const reducer = useCallback(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'setClusterName':
          return {
            ...state,
            clusterName: action.clusterName,
            defaultLabels: { ...state.defaultLabels, name: action.clusterName },
          }
        case 'setImportMode':
          return { ...state, importMode: action.importMode }
        case 'setManagedClusterSet':
          return {
            ...state,
            managedClusterSet: action.managedClusterSet,
          }
        case 'setAdditionalLabels':
          return { ...state, additionalLabels: action.additionalLabels }
        case 'computeAdditionalLabels': {
          const currentLabels = getLabelsFromState(state)
          let newLabels = undefined
          if (!isEqual(currentLabels, action.labels)) {
            newLabels = action.labels
          } else if (isACMAvailable && !isEqual(currentLabels, action.labelsKAC)) {
            newLabels = action.labelsKAC
          }
          if (newLabels) {
            // Update cluster set
            const managedClusterSet = newLabels?.[managedClusterSetLabel] ?? ''
            // Additonal labels excludes the ManagedClusterSet label and any unchanged default labels
            // Changed default labels get added to additional labels to shadow the defaults
            const additionalLabelKeys = Object.keys(newLabels).filter(
              (key) =>
                key !== managedClusterSetLabel &&
                (!Object.keys(state.defaultLabels).includes(key) || state.defaultLabels[key] !== newLabels[key])
            )
            return {
              ...state,
              managedClusterSet,
              additionalLabels: pick(newLabels, additionalLabelKeys),
            }
          } else {
            return state
          }
        }
        case 'setTemplateName':
          return { ...state, templateName: action.templateName }
        case 'setToken':
          return state.importMode === ImportMode.token ? { ...state, token: action.token } : state
        case 'setServer':
          return state.importMode === ImportMode.token ? { ...state, server: action.server } : state
        case 'setClusterID':
          return state.importMode === ImportMode.discoveryOCM ? { ...state, clusterID: action.clusterID } : state
        case 'setNamespace':
          if (state.importMode === ImportMode.discoveryOCM) {
            const credentials = getCredentialsInNamespace(ocmCredentials, action.namespace)
            return {
              ...state,
              namespace: action.namespace,
              credentials,
              credential: credentials[0].metadata.name ?? '',
            }
          }
          return state
        case 'setCredential':
          return state.importMode === ImportMode.discoveryOCM ? { ...state, credential: action.credential } : state
        case 'setKubeconfig':
          return state.importMode === ImportMode.kubeconfig ? { ...state, kubeconfig: action.kubeconfig } : state
        case 'updateCredentials': {
          const namespaceExists = doesNamespaceExist(ocmCredentials, state.namespace)
          const filteredCredentials = namespaceExists ? getFilteredCredentials(ocmCredentials, state.namespace) : []

          const credentialExists = doesCredentialExist(filteredCredentials, state.credential)

          let newCredential = ''
          if (credentialExists) {
            newCredential = state.credential
          } else if (filteredCredentials.length > 0) {
            newCredential = filteredCredentials[0].metadata.name ?? ''
          }
          return {
            ...state,
            namespace: namespaceExists ? state.namespace : '',
            credential: newCredential,
            credentials: filteredCredentials,
          }
        }
      }
    },
    [isACMAvailable, ocmCredentials]
  )

  const [state, dispatch] = useReducer(
    reducer,
    {
      initialClusterName,
      initialServer,
      initialClusterID,
      discoveryCredential: initialDiscoveryCredential,
      discoveryClusterType: discoveryType,
      initialAPIToken,
      credentialList: ocmCredentials,
    },
    getInitialState
  )

  const prevOcmCredentials = usePrevious(ocmCredentials)

  useEffect(() => {
    if (prevOcmCredentials !== ocmCredentials) {
      dispatch({ type: 'updateCredentials' })
    }
  }, [ocmCredentials, prevOcmCredentials])

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

    if (state.importMode === ImportMode.discoveryOCM) {
      resources.push({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: AUTO_IMPORT_SECRET,
          namespace: initialClusterName,
        },
        stringData: {
          cluster_id: initialClusterID,
          auth_method: initialAuthMethod,
          api_token: initialAPIToken,
          client_id: initialClientID,
          client_secret: initialClientSecret,
        },
        type: 'auto-import/rosa',
      })
    }

    if (state.importMode === ImportMode.token) {
      resources.push({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: AUTO_IMPORT_SECRET,
          namespace: initialClusterName,
        },
        stringData: {
          token: '',
          server: initialServer,
        },
        type: 'Opaque',
      })
    }
    if (isACMAvailable) {
      resources.push({
        apiVersion: KlusterletAddonConfigApiVersion,
        kind: KlusterletAddonConfigKind,
        metadata: { name: initialClusterName, namespace: initialClusterName },
        spec: {
          clusterName: initialClusterName,
          clusterNamespace: initialClusterName,
          clusterLabels: { ...state.defaultLabels },
          applicationManager: { enabled: true },
          policyController: { enabled: true },
          searchCollector: { enabled: true },
          certPolicyController: { enabled: true },
        },
      })
    }
    return resources
  }, [
    discovered,
    initialClusterName,
    state.defaultLabels,
    state.importMode,
    isACMAvailable,
    initialClusterID,
    initialAuthMethod,
    initialAPIToken,
    initialClientID,
    initialClientSecret,
    initialServer,
  ])

  const syncs = [
    {
      path: 'ManagedCluster[0].metadata.name',
      setState: (clusterName: State['clusterName']) => dispatch({ type: 'setClusterName', clusterName }),
    },
    {
      getter: (template: any) => {
        const labels = get(template, 'ManagedCluster[0].metadata.labels', {})
        let labelsKAC = undefined
        if (isACMAvailable) {
          labelsKAC = get(template, 'KlusterletAddonConfig[0].spec.clusterLabels', {})
        }
        return { labels, labelsKAC }
      },
      setState: ({ labels, labelsKAC }: { labels: Labels; labelsKAC?: Labels }) =>
        dispatch({ type: 'computeAdditionalLabels', labels, labelsKAC }),
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
    {
      path: 'Secret[0].stringData.clusterID',
      setState: (clusterID: State['clusterID']) => dispatch({ type: 'setClusterID', clusterID }),
    },
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
        secrets={[
          'Secret.*.stringData.token',
          'Secret.*.stringData.kubeconfig',
          'Secret.*.stringData.api_token',
          'Secret.*.stringData.client_secret',
        ]}
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
              navigate(
                generatePath(NavigationPath.clusterDetails, {
                  name: state.clusterName,
                  namespace: UNKNOWN_NAMESPACE,
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
                <div className={description}>{t('template.clusterImport.info')}</div>
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
  const { state, dispatch } = props
  const { defaultLabels, managedClusterSet, additionalLabels } = state
  const { t } = useTranslation()
  const resources = useItem() as any[]
  const { update } = useData()
  const mode = useDisplayMode()

  const managedCluster = resources.find((item) => item.kind === ManagedClusterKind) as ManagedCluster
  const klusterletAddonConfig = resources.find(
    (item) => item.kind === KlusterletAddonConfigKind
  ) as KlusterletAddonConfig

  const onChangeAdditionalLabels = useCallback(
    (labels: Labels) => dispatch({ type: 'setAdditionalLabels', additionalLabels: labels }),
    [dispatch]
  )

  useLayoutEffect(() => {
    const newLabels = getLabelsFromState(state)
    managedCluster.metadata.labels = { ...newLabels }
    if (klusterletAddonConfig) {
      klusterletAddonConfig.spec.clusterLabels = { ...newLabels }
    }
    update(resources)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(additionalLabels), managedClusterSet, JSON.stringify(defaultLabels), update])

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
    state: { clusterName, importMode, kubeconfig, server, token, clusterID, namespace, credentials, credential },
    dispatch,
  } = props
  const { t } = useTranslation()

  const resources = useItem() as any[]
  const { update } = useData()
  const mode = useDisplayMode()
  const { RHOCMCredentials } = useSharedSelectors()
  const ocmCredentials = useRecoilValue(RHOCMCredentials)
  let ocmCredentialNamespaces = ocmCredentials.map((credential) => credential.metadata.namespace!)
  ocmCredentialNamespaces = [...new Set(ocmCredentialNamespaces)]

  const autoImportSecret = useMemo(
    (): Secret => ({
      apiVersion: SecretApiVersion,
      kind: SecretKind,
      metadata: {
        name: AUTO_IMPORT_SECRET,
        namespace: clusterName,
      },
      stringData: {},
      type: 'Opaque',
    }),
    [clusterName]
  )

  const updateROSAImportSecret = useCallback(
    (credentialName: string, discoverySecret: Secret) => {
      const selectedCredential = ocmCredentials.find((credential) => credential.metadata.name === credentialName)
      const authMethod = selectedCredential?.stringData?.auth_method ?? 'offline-token'
      // Updating the discovery secret based on the auth_method
      if (authMethod === 'service-account') {
        discoverySecret.stringData = {
          cluster_id: clusterID,
          auth_method: 'service-account',
          client_id: selectedCredential?.stringData?.client_id ?? '',
          client_secret: selectedCredential?.stringData?.client_secret ?? '',
        }
      } else if (authMethod === 'offline-token') {
        discoverySecret.stringData = {
          cluster_id: clusterID,
          auth_method: 'offline-token',
          api_token: selectedCredential?.stringData?.ocmAPIToken ?? '',
        }
      }
      discoverySecret.type = 'auto-import/rosa'
      return discoverySecret
    },
    [clusterID, ocmCredentials]
  )

  const getImportModeDescription = (m: ImportMode) => {
    switch (m) {
      case ImportMode.manual:
        return t('import.mode.manual')
      case ImportMode.token:
        return t('import.mode.token')
      case ImportMode.kubeconfig:
        return t('import.mode.kubeconfig')
      case ImportMode.discoveryOCM:
        return t('import.mode.discovery')
    }
    return '-'
  }

  const getImportModeHelperText = (m: ImportMode) => {
    switch (m) {
      case ImportMode.manual:
        return t('import.description')
      case ImportMode.discoveryOCM:
        return t('import.mode.discovery.helpertext')
      default:
        return t('import.credential.explanation')
    }
  }

  const getSecretTemplate = useCallback(
    () => resources.find((item) => item.kind === 'Secret' && item?.metadata?.name === AUTO_IMPORT_SECRET),
    [resources]
  )

  const replaceSecretTemplate = useCallback(
    (newSecret?: Secret) => {
      const secretIndex = resources.findIndex(
        (item) => item.kind === 'Secret' && item?.metadata?.name === AUTO_IMPORT_SECRET
      )
      const deleteCount = secretIndex >= 0 ? 1 : 0
      if (newSecret) {
        resources.splice(deleteCount ? secretIndex : 1, deleteCount, newSecret)
      } else if (deleteCount) {
        resources.splice(secretIndex, 1)
      }
      update()
    },
    [resources, update]
  )

  const onChangeImportMode = useCallback(
    (importMode?: string) => {
      if (isImportMode(importMode)) {
        dispatch({ type: 'setImportMode', importMode })
      }
    },
    [dispatch]
  )

  const prevImportMode = usePrevious(importMode)
  const prevCredential = usePrevious(credential)

  if (prevImportMode !== importMode || prevCredential !== credential) {
    // Preserve anything added to the secret by the user, like annotations
    const newAutoImportSecret = { ...autoImportSecret, ...(getSecretTemplate() ?? {}), ...{ type: 'Opaque' } }

    switch (importMode) {
      case ImportMode.manual:
        // Delete auto-import secret
        replaceSecretTemplate()
        break
      case ImportMode.kubeconfig: {
        // Insert/Replace auto-import secret
        newAutoImportSecret.stringData = { kubeconfig }
        replaceSecretTemplate(newAutoImportSecret)
        break
      }
      case ImportMode.token: {
        // Insert/Replace auto-import secret
        newAutoImportSecret.stringData = { token, server }
        replaceSecretTemplate(newAutoImportSecret)
        break
      }
      case ImportMode.discoveryOCM: {
        // Insert/Replace auto-import secret
        const discoverySecret = updateROSAImportSecret(credential, newAutoImportSecret)
        replaceSecretTemplate(discoverySecret)
        break
      }
    }
  }

  const validateKubeconfig = useCallback((value: string) => validateYAML(value, t), [t])
  const controlId = 'import-mode'
  const controlLabel = t('import.mode.select')
  const credentialControlId = 'credential'
  const credentialLabel = t('import.credential')
  const namespaceControlId = 'namespace'
  const namespaceLabel = t('discoveryConfig.namespaces.label')
  return (
    <>
      {mode === DisplayMode.Details ? (
        <DescriptionListGroup>
          <DescriptionListTerm>{controlLabel}</DescriptionListTerm>
          <DescriptionListDescription id={controlId}>{getImportModeDescription(importMode)}</DescriptionListDescription>
        </DescriptionListGroup>
      ) : (
        <AcmFormInputAdapter>
          <AcmSelect
            id={controlId}
            label={controlLabel}
            placeholder={t('import.mode.default')}
            value={importMode}
            onChange={onChangeImportMode}
            helperText={getImportModeHelperText(importMode)}
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
        </AcmFormInputAdapter>
      )}
      {mode === DisplayMode.Details ? (
        <DescriptionListGroup>
          <DescriptionListTerm>{namespaceLabel}</DescriptionListTerm>
          <DescriptionListDescription id={namespaceControlId}>{namespace}</DescriptionListDescription>
        </DescriptionListGroup>
      ) : (
        <AcmFormInputAdapter>
          <AcmSelect
            id={'namespace'}
            label={t('discoveryConfig.namespaces.label')}
            placeholder={t('discoveryConfig.namespaces.placeholder')}
            labelHelp={t('discoveryConfig.namespaces.labelHelp')}
            value={namespace}
            isRequired={importMode === ImportMode.discoveryOCM}
            hidden={importMode !== ImportMode.discoveryOCM}
            onChange={(namespaceName) => {
              if (namespaceName) {
                dispatch({ type: 'setNamespace', namespace: namespaceName })
              }
            }}
          >
            {ocmCredentialNamespaces.map((namespace) => {
              return (
                <SelectOption key={namespace} value={namespace}>
                  {namespace}
                </SelectOption>
              )
            })}
          </AcmSelect>
        </AcmFormInputAdapter>
      )}
      {mode === DisplayMode.Details ? (
        <DescriptionListGroup>
          <DescriptionListTerm>{credentialLabel}</DescriptionListTerm>
          <DescriptionListDescription id={credentialControlId}>{credential}</DescriptionListDescription>
        </DescriptionListGroup>
      ) : (
        <AcmFormInputAdapter>
          <AcmSelect
            id={credentialControlId}
            label={credentialLabel}
            placeholder={t('import.credential.place')}
            value={credential}
            onChange={(credentialName) => {
              if (credentialName) {
                dispatch({ type: 'setCredential', credential: credentialName })
              }
            }}
            isRequired={importMode === ImportMode.discoveryOCM}
            hidden={importMode !== ImportMode.discoveryOCM}
            isDisabled={!namespace}
          >
            {credentials.map((credential) => {
              return (
                <SelectOption key={credential.metadata.uid} value={credential.metadata.name}>
                  {credential.metadata.name}
                </SelectOption>
              )
            })}
          </AcmSelect>
        </AcmFormInputAdapter>
      )}
      <Sync kind={ManagedClusterKind} path="metadata.name" targetKind={SecretKind} targetPath="metadata.namespace" />
      <Sync kind={ManagedClusterKind} path="metadata.name" targetKind={ClusterCuratorKind} targetPath="metadata.name" />
      <Sync
        kind={ManagedClusterKind}
        path="metadata.name"
        targetKind={ClusterCuratorKind}
        targetPath="metadata.namespace"
      />
      <WizItemSelector selectKey="metadata.name" selectValue={AUTO_IMPORT_SECRET}>
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
        <WizTextInput
          id="clusterID"
          path="stringData.cluster_id"
          label={t('import.clusterid')}
          placeholder={t('import.clusterid.place')}
          onValueChange={(s: any) => dispatch({ type: 'setClusterID', clusterID: (s as State['clusterID']) ?? '' })}
          required={importMode === ImportMode.discoveryOCM}
          hidden={() => importMode !== ImportMode.discoveryOCM}
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
    (template?: string) => {
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
    },
    [ansibleCredentials, clusterName, curatorTemplates, dispatch, resources, supportedCurations]
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
      <AcmFormInputAdapter>
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
      </AcmFormInputAdapter>
      <TemplateLinkOut templateCurator={selectedTemplateName} />
      <TemplateSummaryExpandable clusterCurator={resources.find((r) => r.kind === ClusterCuratorKind)} />
    </>
  )
}
