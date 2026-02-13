/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, PageSection } from '@patternfly/react-core'
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
import { Fragment, useMemo, useState } from 'react'
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
                      confirmText: t('confirm'),
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
                confirmText: t('confirm'),
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
