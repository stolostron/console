/* Copyright Contributors to the Open Cluster Management project */
import {
  ButtonVariant,
  NumberInput,
  NumberInputProps,
  PageSection,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
  AcmButton,
  AcmEmptyState,
  AcmInlineProvider,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmTable,
  compareStrings,
  Provider,
  ProviderLongTextMap,
} from '../../ui-components'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { Link, generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { BulkActionModal, BulkActionModalProps } from '../../components/BulkActionModal'
import { RbacDropdown } from '../../components/Rbac'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch, useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'
import { getBackCancelLocationLinkProps, navigateToBackCancelLocation, NavigationPath } from '../../NavigationPath'
import {
  DiscoveryConfig,
  ProviderConnection,
  Secret,
  SecretDefinition,
  unpackProviderConnection,
} from '../../resources'
import { deleteResource, getISOStringTimestamp } from '../../resources/utils'
import AcmTimestamp from '../../lib/AcmTimestamp'
import {
  FleetK8sResourceCommon,
  useFleetK8sWatchResource,
  useFleetK8sWatchResources,
} from '@stolostron/multicluster-sdk'

const CM_NAME = 'kevin-test'
const CM_NAMESPACE = 'default'
const SECRET_NAME = 'kevin-test'
const SECRET_NAMESPACE = 'default'
const CLUSTER_NAME = 'virt-managed'
const HUB_NAME = 'virt-hub'

function ValueDisplay(props: { value?: string; cluster?: string; loaded: boolean; error?: any }) {
  const { value, cluster, loaded, error } = props
  return (
    <p>
      {value} ({cluster}) / {loaded ? 'true' : 'false'} / {error ? error.toString() : ''}
    </p>
  )
}

function MultiValueDisplay(props: {
  text: string
  watches: { key: string; value?: string; cluster?: string; loaded: boolean; loadError?: any }[]
}) {
  const { watches } = props
  return (
    <>
      {watches.map(({ key, value, cluster, loaded, loadError }) => (
        <p key={key}>
          {key}: {value} ({cluster}) / {loaded ? 'true' : 'false'} / {loadError ? loadError.toString() : ''}
        </p>
      ))}
    </>
  )
}

type ValueType = FleetK8sResourceCommon & { data: { value: string } }
type ListType = ValueType[]

type WatchSecretAndConfigMap = {
  configmap: ValueType
  secret: ValueType
}

function ConfigMapWatchDisplayComponent() {
  const [result, loaded, error] = useFleetK8sWatchResource<ValueType>({
    cluster: CLUSTER_NAME,
    groupVersionKind: { kind: 'ConfigMap', version: 'v1' },
    namespace: CM_NAMESPACE,
    name: CM_NAME,
  })
  const cluster = result?.cluster
  const value = result?.data?.value ?? ''
  return <ValueDisplay value={value} cluster={cluster} loaded={loaded} error={error} />
}

function ConfigMapWatchDisplayComponentList() {
  const [result, loaded, error] = useFleetK8sWatchResource<ListType>({
    cluster: CLUSTER_NAME,
    groupVersionKind: { kind: 'ConfigMap', version: 'v1' },
    namespace: CM_NAMESPACE,
    isList: true,
  })
  const configmap = result?.find((r) => r?.metadata?.name === CM_NAME)
  const cluster = configmap?.cluster
  const value = configmap?.data?.value ?? ''
  return <ValueDisplay value={value} cluster={cluster} loaded={loaded} error={error} />
}

function SecretWatchDisplayComponent() {
  const [result, loaded, error] = useFleetK8sWatchResource<ValueType>({
    cluster: CLUSTER_NAME,
    groupVersionKind: { kind: 'Secret', version: 'v1' },
    name: SECRET_NAME,
    namespace: SECRET_NAMESPACE,
  })
  const cluster = result?.cluster
  const value = result?.data?.value ? Buffer.from(result?.data?.value, 'base64').toString() : ''
  return <ValueDisplay value={value} cluster={cluster} loaded={loaded} error={error} />
}

function SecretWatchDisplayComponentList() {
  const [result, loaded, error] = useFleetK8sWatchResource<ListType>({
    cluster: CLUSTER_NAME,
    groupVersionKind: { kind: 'Secret', version: 'v1' },
    namespace: SECRET_NAMESPACE,
    isList: true,
  })
  const secret = result?.find((r) => r?.metadata?.name === CM_NAME)
  const cluster = secret?.cluster
  const value = secret?.data?.value ? Buffer.from(secret.data?.value, 'base64').toString() : ''
  return <ValueDisplay value={value} cluster={cluster} loaded={loaded} error={error} />
}

function WatchDisplayComponent() {
  const { configmap, secret } = useFleetK8sWatchResources<WatchSecretAndConfigMap>({
    configmap: {
      cluster: CLUSTER_NAME,
      groupVersionKind: { kind: 'ConfigMap', version: 'v1' },
      name: CM_NAME,
      namespace: CM_NAMESPACE,
    },
    secret: {
      cluster: CLUSTER_NAME,
      groupVersionKind: { kind: 'Secret', version: 'v1' },
      name: SECRET_NAME,
      namespace: SECRET_NAMESPACE,
    },
  })
  const cluster = configmap?.data?.cluster
  const cValue = configmap?.data?.data?.value
  const sValue = secret?.data?.data?.value ? Buffer.from(secret.data?.data?.value, 'base64').toString() : ''
  const watches = [
    { key: 'configmap', cluster, value: cValue, ...configmap },
    { key: 'secret', cluster, value: sValue, ...secret },
  ]
  return <MultiValueDisplay text="Multi Managed" watches={watches} />
}

function WatchDisplayComponentMixed() {
  const { configmap, secret } = useFleetK8sWatchResources<WatchSecretAndConfigMap>({
    configmap: {
      cluster: CLUSTER_NAME,
      groupVersionKind: { kind: 'ConfigMap', version: 'v1' },
      name: CM_NAME,
      namespace: CM_NAMESPACE,
    },
    secret: {
      cluster: HUB_NAME,
      groupVersionKind: { kind: 'Secret', version: 'v1' },
      name: SECRET_NAME,
      namespace: SECRET_NAMESPACE,
    },
  })
  const cCluster = configmap?.data?.cluster
  const cValue = configmap?.data?.data?.value
  const sValue = secret?.data?.data?.value ? Buffer.from(secret.data?.data?.value, 'base64').toString() : ''
  const sCluster = secret?.data?.cluster
  const watches = [
    { key: 'configmap', cluster: cCluster, value: cValue, ...configmap },
    { key: 'secret', cluster: sCluster, value: sValue, ...secret },
  ]
  return <MultiValueDisplay text="Multi Mixed" watches={watches} />
}

function WatchDisplayComponentHub() {
  const { configmap, secret } = useFleetK8sWatchResources<WatchSecretAndConfigMap>({
    configmap: {
      cluster: HUB_NAME,
      groupVersionKind: { kind: 'ConfigMap', version: 'v1' },
      name: CM_NAME,
      namespace: CM_NAMESPACE,
    },
    secret: {
      cluster: HUB_NAME,
      groupVersionKind: { kind: 'Secret', version: 'v1' },
      name: SECRET_NAME,
      namespace: SECRET_NAMESPACE,
    },
  })
  const cluster = configmap.data?.cluster
  const cValue = configmap?.data?.data?.value
  const sValue = secret?.data?.data?.value ? Buffer.from(secret.data.data.value, 'base64').toString() : ''
  const watches = [
    { key: 'configmap', cluster, value: cValue, ...configmap },
    { key: 'secret', cluster, value: sValue, ...secret },
  ]
  return <MultiValueDisplay text="Multi Hub" watches={watches} />
}

function MultiComponent(props: { title: string; component: React.FC }) {
  const { title, component: Component } = props
  const [value, setValue] = useState(0)
  const onMinus = useCallback(() => setValue((value) => (value > 0 ? value - 1 : 0)), [])
  const onPlus = useCallback(() => setValue((value) => value + 1), [])
  const onChange = useCallback<NonNullable<NumberInputProps['onChange']>>((event) => {
    const newValue = Number.parseInt((event.target as HTMLInputElement).value, 10)
    if (Number.isInteger(newValue) && newValue >= 0) {
      setValue(newValue)
    }
  }, [])
  const keys = new Array(value)
  for (let i = 0; i < value; i++) {
    keys[i] = i + 1
  }
  return (
    <Stack>
      <StackItem>
        <b>{title}</b>
      </StackItem>
      <StackItem>
        <NumberInput value={value} onMinus={onMinus} onPlus={onPlus} onChange={onChange} />
      </StackItem>
      {keys.map((k) => (
        <StackItem key={`item-${k}`}>
          <Component />
        </StackItem>
      ))}
    </Stack>
  )
}

export default function CredentialsPage() {
  const { secretsState, discoveryConfigState } = useSharedAtoms()
  const { t } = useTranslation()
  const secrets = useRecoilValue(secretsState)
  const credentialsSecrets = useMemo(
    () =>
      secrets.filter(
        (secret) => secret?.metadata?.labels?.['cluster.open-cluster-management.io/credentials'] !== undefined
      ),
    [secrets]
  )

  const providerConnections = secrets.map(unpackProviderConnection)
  const discoveryConfigs = useRecoilValue(discoveryConfigState)

  return (
    <AcmPage header={<AcmPageHeader title={t('Credentials')} />}>
      <AcmPageContent id="credentials">
        <PageSection hasBodyWrapper={false}>
          <Split hasGutter>
            <SplitItem>
              <Stack>
                <StackItem>
                  <MultiComponent title="ConfigMap Spoke" component={ConfigMapWatchDisplayComponent} />
                </StackItem>
                <StackItem>
                  <MultiComponent title="ConfigMap Spoke (list)" component={ConfigMapWatchDisplayComponentList} />
                </StackItem>
              </Stack>
            </SplitItem>
            <SplitItem>
              <StackItem>
                <MultiComponent title="Secret Spoke" component={SecretWatchDisplayComponent} />
              </StackItem>
              <StackItem>
                <MultiComponent title="Secret Spoke (list)" component={SecretWatchDisplayComponentList} />
              </StackItem>
            </SplitItem>
            <SplitItem>
              <MultiComponent title="Multi Spoke" component={WatchDisplayComponent} />
            </SplitItem>
            <SplitItem>
              <MultiComponent title="Multi Spoke/Hub" component={WatchDisplayComponentMixed} />
            </SplitItem>
            <SplitItem>
              <MultiComponent title="Multi Hub" component={WatchDisplayComponentHub} />
            </SplitItem>
          </Split>

          <CredentialsTable
            providerConnections={providerConnections}
            discoveryConfigs={discoveryConfigs}
            secrets={credentialsSecrets}
          />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

function getProviderName(labels: Record<string, string> | undefined) {
  const label = labels?.['cluster.open-cluster-management.io/type']
  if (label) {
    const providerName = (ProviderLongTextMap as Record<string, string>)[label]
    if (providerName) return providerName
  }
  return 'unknown'
}

export function CredentialsTable(props: {
  providerConnections?: ProviderConnection[]
  discoveryConfigs?: DiscoveryConfig[]
  secrets?: Secret[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<Secret> | { open: false }>({
    open: false,
  })
  const unauthorizedMessage = t('rbac.unauthorized')
  const canAddCredential = useIsAnyNamespaceAuthorized(rbacCreate(SecretDefinition))

  sessionStorage.removeItem('DiscoveryCredential')

  function getAdditionalActions(item: Secret) {
    const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
    if (label === Provider.redhatcloud && !CredentialIsInUseByDiscovery(item)) {
      return t('Create cluster discovery')
    } else {
      return t('Configure cluster discovery')
    }
  }

  function CredentialIsInUseByDiscovery(credential: Secret) {
    let inUse = false
    if (props.discoveryConfigs) {
      props.discoveryConfigs.forEach((discoveryConfig) => {
        if (
          discoveryConfig.metadata &&
          discoveryConfig.spec.credential !== '' &&
          credential.metadata &&
          discoveryConfig.metadata.namespace === credential.metadata.namespace
        ) {
          inUse = true
          return
        }
      })
    }
    return inUse
  }

  const getAdditionalActionsText = (item: Secret) => {
    const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
    if (label === Provider.redhatcloud) {
      if (CredentialIsInUseByDiscovery(item)) {
        return t('Configure cluster discovery')
      } else {
        return t('Create cluster discovery')
      }
    } else {
      return '-'
    }
  }

  return (
    <Fragment>
      <BulkActionModal<Secret> {...modalProps} />
      <AcmTable<Secret>
        showExportButton
        exportFilePrefix="credentials"
        emptyState={
          <AcmEmptyState
            title={t(`You don't have any credentials yet`)}
            message={t('To get started, add your credentials.')}
            action={
              <div>
                <AcmButton
                  isDisabled={!canAddCredential}
                  tooltip={!canAddCredential ? unauthorizedMessage : ''}
                  component={Link}
                  {...getBackCancelLocationLinkProps(NavigationPath.addCredentials)}
                >
                  {t('Add credential')}
                </AcmButton>
                <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CONNECTION} />
              </div>
            }
          />
        }
        items={props.secrets}
        columns={[
          {
            header: t('Name'),
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: (secret) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <Link
                  to={generatePath(NavigationPath.viewCredentials, {
                    namespace: secret.metadata.namespace!,
                    name: secret.metadata.name!,
                  })}
                >
                  {secret.metadata.name}
                </Link>
              </span>
            ),
            exportContent: (secret) => secret.metadata.name,
          },
          {
            header: t('Credential type'),
            sort: /* istanbul ignore next */ (a: Secret, b: Secret) => {
              return compareStrings(getProviderName(a.metadata?.labels), getProviderName(b.metadata?.labels))
            },
            cell: (item: Secret) => {
              const provider = item.metadata.labels?.['cluster.open-cluster-management.io/type']
              if (provider) return <AcmInlineProvider provider={provider as Provider} />
              else return <Fragment />
            },
            search: (item: Secret) => {
              return getProviderName(item.metadata?.labels)
            },
            exportContent: (item: Secret) => {
              return getProviderName(item.metadata.labels)
            },
          },
          {
            header: t('Namespace'),
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: 'metadata.namespace',
            exportContent: (item: Secret) => {
              return item.metadata.namespace
            },
          },
          {
            header: t('Additional actions'),
            search: (item: Secret) => {
              return getAdditionalActions(item)
            },
            cell: (item: Secret) => {
              const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
              if (label === Provider.redhatcloud) {
                if (CredentialIsInUseByDiscovery(item)) {
                  return <Link to={NavigationPath.configureDiscovery}>{t('Configure cluster discovery')}</Link>
                } else {
                  return <Link to={NavigationPath.createDiscovery}>{t('Create cluster discovery')}</Link>
                }
              } else {
                return <span>-</span>
              }
            },
            exportContent: (item: Secret) => {
              return getAdditionalActionsText(item)
            },
            sort: /* istanbul ignore next */ (a: Secret, b: Secret) => {
              return compareStrings(getAdditionalActions(a), getAdditionalActions(b))
            },
          },
          {
            header: t('Created'),
            sort: 'metadata.creationTimestamp',
            cell: (resource) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <AcmTimestamp timestamp={resource.metadata?.creationTimestamp} />
              </span>
            ),
            exportContent: (item: Secret) => {
              if (item.metadata.creationTimestamp) {
                return getISOStringTimestamp(item.metadata.creationTimestamp)
              }
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            isActionCol: true,
            cell: (secret: Secret) => {
              const actions = [
                {
                  id: 'editConnection',
                  text: t('Edit credential'),
                  isAriaDisabled: true,
                  click: (secret: Secret) => {
                    navigate(
                      generatePath(NavigationPath.editCredentials, {
                        namespace: secret.metadata.namespace!,
                        name: secret.metadata.name!,
                      })
                    )
                  },
                  rbac: [rbacPatch(secret)], // validate that this is working
                },
                {
                  id: 'deleteConnection',
                  text: t('Delete credential'),
                  isAriaDisabled: true,
                  click: (secret: Secret) => {
                    setModalProps({
                      open: true,
                      title: t('Permanently delete credentials?'),
                      action: t('Delete'),
                      processing: t('Deleting'),
                      items: [secret],
                      emptyState: undefined, // there is always 1 item supplied
                      description: t(
                        'You cannot create new clusters from deleted credentials. Clusters that you previously created will not be affected.'
                      ),
                      columns: [
                        {
                          header: t('Name'),
                          cell: 'metadata.name',
                          sort: 'metadata.name',
                        },
                        {
                          header: t('Namespace'),
                          cell: 'metadata.namespace',
                          sort: 'metadata.namespace',
                        },
                      ],
                      keyFn: (secret: Secret) => secret.metadata.uid as string,
                      actionFn: deleteResource,
                      close: () => setModalProps({ open: false }),
                      isDanger: true,
                      icon: 'warning',
                    })
                  },
                  rbac: [rbacDelete(secret)],
                },
              ]

              return (
                <RbacDropdown<Secret>
                  id={`${secret.metadata.name}-actions`}
                  item={secret}
                  isKebab={true}
                  text={t('Actions')}
                  actions={actions}
                />
              )
            },
          },
        ]}
        keyFn={(secret) => secret.metadata?.uid as string}
        tableActionButtons={[
          {
            id: 'add',
            title: t('Add credential'),
            click: () => {
              navigateToBackCancelLocation(navigate, NavigationPath.addCredentials)
            },
            variant: ButtonVariant.primary,
            isDisabled: !canAddCredential,
            tooltip: !canAddCredential ? unauthorizedMessage : '',
          },
        ]}
        tableActions={[
          {
            id: 'deleteConnection',
            title: t('Delete credentials'),
            click: (secrets: Secret[]) => {
              setModalProps({
                open: true,
                title: t('Permanently delete credentials?'),
                action: t('Delete'),
                processing: t('Deleting'),
                items: [...secrets],
                emptyState: undefined, // table action is only enabled when items are selected
                description: t(
                  'You cannot create new clusters from deleted credentials. Clusters that you previously created will not be affected.'
                ),
                columns: [
                  {
                    header: t('Name'),
                    cell: 'metadata.name',
                    sort: 'metadata.name',
                  },
                  {
                    header: t('Namespace'),
                    cell: 'metadata.namespace',
                    sort: 'metadata.namespace',
                  },
                ],
                keyFn: (secret: Secret) => secret.metadata.uid as string,
                actionFn: deleteResource,
                close: () => setModalProps({ open: false }),
                isDanger: true,
              })
            },
            variant: 'bulk-action',
          },
        ]}
        rowActions={[]}
      />
    </Fragment>
  )
}
