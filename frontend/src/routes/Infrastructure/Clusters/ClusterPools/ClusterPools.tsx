/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { ButtonVariant, Flex, FlexItem, PageSection, Stack, Content, ContentVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import {
  AcmAlertContext,
  AcmButton,
  AcmEmptyState,
  AcmExpandableCard,
  AcmInlineProvider,
  AcmInlineStatus,
  AcmPageContent,
  AcmTable,
  IAcmTableButtonAction,
  Provider,
  StatusType,
  ProviderLongTextMap,
} from '../../../../ui-components'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../components/BulkActionModal'
import { RbacButton, RbacDropdown } from '../../../../components/Rbac'
import { TechPreviewAlert } from '../../../../components/TechPreviewAlert'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { navigateToBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import { ClusterClaim, ClusterClaimDefinition, ClusterPool, isClusterPoolDeleting } from '../../../../resources'
import { Cluster, ClusterStatus, deleteResource, ResourceErrorCode } from '../../../../resources/utils'
import { ClusterStatuses, getClusterStatusCount } from '../ClusterSets/components/ClusterStatuses'
import { StatusField } from '../ManagedClusters/components/StatusField'
import { useAllClusters } from '../ManagedClusters/components/useAllClusters'
import { ClusterClaimModal, ClusterClaimModalProps } from './components/ClusterClaimModal'
import { ScaleClusterPoolModal, ScaleClusterPoolModalProps } from './components/ScaleClusterPoolModal'
import { UpdateReleaseImageModal, UpdateReleaseImageModalProps } from './components/UpdateReleaseImageModal'
import { getMappedClusterPoolClusters } from '../ClusterSets/components/useClusters'

export default function ClusterPoolsPage() {
  const alertContext = useContext(AcmAlertContext)
  const navigate = useNavigate()
  const { t } = useTranslation()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])
  const { clusterPoolsState } = useSharedAtoms()
  const clusterPools = useRecoilValue(clusterPoolsState)
  const clusters = useAllClusters()

  /* t('preview.clusterPools') */
  return (
    <AcmPageContent id="clusters">
      <PageSection hasBodyWrapper={false}>
        <TechPreviewAlert i18nKey="preview.clusterPools" docHref={DOC_LINKS.CLUSTER_POOLS} />
        <Stack hasGutter style={{ height: 'unset' }}>
          <AcmExpandableCard title={t('learn.terminology')} id="cluster-pools-learn">
            <Flex style={{ flexWrap: 'inherit' }}>
              <Flex style={{ maxWidth: '50%' }}>
                <FlexItem>
                  <Content>
                    <Content component={ContentVariants.h4}>{t('clusterPools')}</Content>
                    <Content component={ContentVariants.p}>{t('learn.clusterPools')}</Content>
                  </Content>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_POOLS, '_blank')}
                    variant="link"
                    role="link"
                  >
                    {t('view.documentation')}{' '}
                    <ExternalLinkAltIcon />
                  </AcmButton>
                </FlexItem>
              </Flex>
              <Flex>
                <FlexItem>
                  <Content>
                    <Content component={ContentVariants.h4}>{t('clusterClaims')}</Content>
                    <Content component={ContentVariants.p}>{t('learn.clusterClaims')}</Content>
                  </Content>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_CLAIMS, '_blank')}
                    variant="link"
                    role="link"
                  >
                    {t('view.documentation')}{' '}
                    <ExternalLinkAltIcon />
                  </AcmButton>
                </FlexItem>
              </Flex>
            </Flex>
          </AcmExpandableCard>
          <Stack>
            <ClusterPoolsTable
              clusterPools={clusterPools}
              tableActionButtons={[
                {
                  id: 'createClusterPool',
                  title: t('managed.createClusterPool'),
                  click: () => navigateToBackCancelLocation(navigate, NavigationPath.createClusterPool),
                  variant: ButtonVariant.primary,
                },
              ]}
              clusters={clusters}
              emptyState={
                <AcmEmptyState
                  key="mcEmptyState"
                  title={t("You don't have any cluster pools yet")}
                  message={t('To get started, create a cluster pool.')}
                  action={
                    <div>
                      <AcmButton
                        role="link"
                        onClick={() => navigateToBackCancelLocation(navigate, NavigationPath.createClusterPool)}
                      >
                        {t('managed.createClusterPool')}
                      </AcmButton>
                      <ViewDocumentationLink doclink={DOC_LINKS.CLUSTER_POOLS} />
                    </div>
                  }
                />
              }
            />
          </Stack>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}

function determineProvider(clusterPool: ClusterPool) {
  if (clusterPool.spec?.platform?.aws) return Provider.aws
  if (clusterPool.spec?.platform?.gcp) return Provider.gcp
  if (clusterPool.spec?.platform?.azure) return Provider.azure
}

function ClusterPoolProvider(props: { clusterPool: ClusterPool }) {
  const provider: Provider | undefined = determineProvider(props.clusterPool)

  if (!provider) return <>-</>

  return <AcmInlineProvider provider={provider} />
}

export function ClusterPoolsTable(props: {
  clusterPools: ClusterPool[]
  clusters: Cluster[]
  emptyState: React.ReactNode
  tableActionButtons?: IAcmTableButtonAction[]
}) {
  const { clusters } = props
  const {
    clusterImageSetsState,
    clusterClaimsState,
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    clusterManagementAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    clusterCuratorsState,
    hostedClustersState,
    nodePoolsState,
    discoveredClusterState,
  } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const clusterClaims = useRecoilValue(clusterClaimsState)
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const certificateSigningRequests = useRecoilValue(certificateSigningRequestsState)
  const managedClusterAddons = useRecoilValue(managedClusterAddonsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const nodePools = useRecoilValue(nodePoolsState)
  const discoveredClusters = useRecoilValue(discoveredClusterState)

  const { clusterPools } = props
  const { t } = useTranslation()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ClusterPool> | { open: false }>({
    open: false,
  })
  const [clusterClaimModalProps, setClusterClaimModalProps] = useState<ClusterClaimModalProps | undefined>()
  const [scaleClusterPoolModalProps, setScaleClusterPoolModalProps] = useState<ScaleClusterPoolModalProps | undefined>()
  const [updateReleaseImageModalProps, setUpdateReleaseImageModalProps] = useState<
    UpdateReleaseImageModalProps | undefined
  >()
  const clusterPoolClusters: Record<string, Cluster[]> = {}

  props.clusterPools?.forEach((clusterPool) => {
    if (clusterPool.metadata.name) {
      const clusters = getMappedClusterPoolClusters({
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddOns: managedClusterAddons,
        clusterManagementAddOns: clusterManagementAddons,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        hostedClusters,
        nodePools,
        discoveredClusters,
        clusterPool,
      })
      clusterPoolClusters[clusterPool.metadata.name] = clusters
    }
  })

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (clusterPool: ClusterPool) => <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>,
        sort: 'metadata.name',
      },
      {
        header: t('table.namespace'),
        sort: 'metadata.namespace',
        search: 'metadata.namespace',
        cell: (clusterPool: ClusterPool) => {
          return clusterPool.metadata.namespace
        },
      },
      {
        header: t('table.provider'),
        cell: (clusterPool: ClusterPool) => {
          return <ClusterPoolProvider clusterPool={clusterPool} />
        },
      },
    ],
    [t]
  )

  function mckeyFn(clusterPool: ClusterPool) {
    return clusterPool.metadata.uid!
  }

  const deletingPools = clusterPools?.filter((clusterPool) => isClusterPoolDeleting(clusterPool))

  const getDistributionVersion = (clusterPool: ClusterPool) => {
    const imageSetRef = clusterPool.spec!.imageSetRef.name
    const imageSet = clusterImageSets.find((cis) => cis.metadata.name === imageSetRef)
    const releaseImage = imageSet?.spec?.releaseImage
    const tagStartIndex = releaseImage?.indexOf(':') ?? 0
    const version = releaseImage?.slice(tagStartIndex + 1, releaseImage.indexOf('-', tagStartIndex))
    return version ? `OpenShift ${version}` : '-'
  }

  return (
    <Fragment>
      <BulkActionModal<ClusterPool> {...modalProps} />
      <ClusterClaimModal {...clusterClaimModalProps} />
      <ScaleClusterPoolModal {...scaleClusterPoolModalProps} />
      <UpdateReleaseImageModal {...updateReleaseImageModalProps} />
      <AcmTable<ClusterPool>
        items={clusterPools}
        disabledItems={deletingPools}
        showExportButton
        exportFilePrefix="clusterpool"
        addSubRows={(clusterPool: ClusterPool) => {
          const clusterPoolClusters = clusters.filter(
            (cluster) =>
              cluster.hive.clusterPool === clusterPool.metadata.name &&
              cluster.hive.clusterPoolNamespace === clusterPool.metadata.namespace &&
              cluster.hive.clusterClaimName === undefined
          )
          const clusterPoolClaims = clusterClaims.filter((claim) => {
            return claim.spec?.clusterPoolName === clusterPool.metadata.name && !claim.spec?.namespace
          })
          const subRows = []
          if (clusterPoolClusters.length > 0) {
            subRows.push({
              cells: [
                {
                  title: (
                    <>
                      <Content>
                        <Content component={ContentVariants.h3}>{t('clusterPool.clusters')}</Content>
                      </Content>
                      <ClusterPoolClustersTable clusters={clusterPoolClusters} />
                    </>
                  ),
                },
              ],
            })
          }
          if (clusterPoolClaims.length > 0) {
            subRows.push({
              cells: [
                {
                  title: (
                    <>
                      <Content>
                        <Content component={ContentVariants.h3}>{t('pending.cluster.claims')}</Content>
                      </Content>
                      <ClusterPoolClaimsTable claims={clusterPoolClaims} />
                    </>
                  ),
                },
              ],
            })
          }
          return subRows
        }}
        columns={[
          {
            header: t('table.name'),
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: (clusterPool: ClusterPool) => {
              return clusterPool.metadata.name
            },
            exportContent: (clusterPool: ClusterPool) => {
              return clusterPool.metadata.name
            },
          },
          {
            header: t('table.namespace'),
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: (clusterPool: ClusterPool) => {
              return clusterPool.metadata.namespace
            },
            exportContent: (clusterPool: ClusterPool) => {
              return clusterPool.metadata.namespace
            },
          },
          {
            header: t('table.cluster.statuses'),
            cell: (clusterPool: ClusterPool) => {
              if (isClusterPoolDeleting(clusterPool)) {
                return <AcmInlineStatus type={StatusType.progress} status={t('destroying')} />
              } else {
                return <ClusterStatuses clusterPool={clusterPool} />
              }
            },
            exportContent: (clusterPool: ClusterPool) => {
              if (isClusterPoolDeleting(clusterPool)) {
                return t('destroying')
              } else {
                const status = getClusterStatusCount(clusterPoolClusters[clusterPool.metadata.name!])
                const clusterStatusAvailable =
                  status &&
                  Object.values(status).find((val) => {
                    return typeof val === 'number' && val > 0
                  })

                if (clusterStatusAvailable) {
                  return (
                    `${t('healthy')}: ${status?.healthy}, ${t('running')}: ${status?.running}, ` +
                    `${t('warning')}: ${status?.warning}, ${t('progress')}: ${status?.progress}, ` +
                    `${t('danger')}: ${status?.danger}, ${t('detached')}: ${status?.detached}, ` +
                    `${t('pending')}: ${status?.pending}, ${t('sleep')}: ${status?.sleep}, ` +
                    `${t('unknown')}: ${status?.unknown}`
                  )
                }
              }
            },
          },
          {
            header: t('table.available'),
            cell: (clusterPool: ClusterPool) => {
              if (!isClusterPoolDeleting(clusterPool)) {
                const ready = clusterPool?.status?.ready === undefined ? 0 : clusterPool?.status?.ready
                return (
                  <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
                    {t('outOf', {
                      firstNumber: ready,
                      secondNumber: clusterPool.spec!.size,
                    })}
                  </span>
                )
              }
            },
            exportContent: (clusterPool: ClusterPool) => {
              if (!isClusterPoolDeleting(clusterPool)) {
                const ready = clusterPool?.status?.ready === undefined ? 0 : clusterPool?.status?.ready
                return t('outOf', {
                  firstNumber: ready,
                  secondNumber: clusterPool.spec!.size,
                })
              }
            },
          },
          {
            header: t('table.provider'),
            cell: (clusterPool: ClusterPool) => {
              return <ClusterPoolProvider clusterPool={clusterPool} />
            },
            exportContent: (clusterPool: ClusterPool) => {
              const provider = determineProvider(clusterPool)
              if (provider) {
                return ProviderLongTextMap[provider]
              }
            },
          },
          {
            header: t('table.distribution'),
            sort: 'spec.imageSetRef.name',
            search: 'spec.imageSetRef.name',
            cell: (clusterPool: ClusterPool) => {
              return getDistributionVersion(clusterPool)
            },
            exportContent: (clusterPool: ClusterPool) => {
              return getDistributionVersion(clusterPool)
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            cell: (clusterPool: ClusterPool) => {
              if (!isClusterPoolDeleting(clusterPool)) {
                return (
                  <RbacButton
                    onClick={() => {
                      setClusterClaimModalProps({
                        clusterPool,
                        onClose: () => setClusterClaimModalProps(undefined),
                      })
                    }}
                    variant="link"
                    style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
                    rbac={[rbacCreate(ClusterClaimDefinition, clusterPool.metadata.namespace)]}
                  >
                    {t('clusterPool.claim')}
                  </RbacButton>
                )
              }
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            isActionCol: true,
            cell: (clusterPool: ClusterPool) => {
              if (!isClusterPoolDeleting(clusterPool)) {
                const actions = [
                  {
                    id: 'scaleClusterPool',
                    text: t('clusterPool.scale'),
                    isAriaDisabled: true,
                    rbac: [rbacPatch(clusterPool)],
                    click: (clusterPool: ClusterPool) => {
                      setScaleClusterPoolModalProps({
                        clusterPool,
                        onClose: () => setScaleClusterPoolModalProps(undefined),
                      })
                    },
                  },
                  {
                    id: 'updateReleaseImage',
                    text: t('clusterPool.updateReleaseImage'),
                    isAriaDisabled: true,
                    rbac: [rbacPatch(clusterPool)],
                    click: (clusterPool: ClusterPool) => {
                      return setUpdateReleaseImageModalProps({
                        clusterPools: [clusterPool],
                        close: () => setUpdateReleaseImageModalProps(undefined),
                      })
                    },
                  },
                  {
                    id: 'destroy',
                    text: t('clusterPool.destroy'),
                    isAriaDisabled: true,
                    click: (clusterPool: ClusterPool) => {
                      const claimClusters = clusters.filter(
                        (cluster) =>
                          cluster.hive.clusterPool === clusterPool.metadata.name && cluster.hive.clusterClaimName
                      )

                      const hasClaims = claimClusters.length > 0

                      setModalProps({
                        open: true,
                        title: t('bulk.title.destroyClusterPool'),
                        action: t('destroy'),
                        processing: t('destroying'),
                        items: [clusterPool],
                        emptyState: undefined, // there is always 1 item supplied
                        description: hasClaims
                          ? t('The cluster pool deletion will be blocked until all claimed cluster(s) are deleted.')
                          : t('bulk.message.destroyClusterPool'),
                        columns: modalColumns,
                        keyFn: mckeyFn,
                        actionFn: deleteResource,
                        confirmText: clusterPool.metadata.name!,
                        close: () => setModalProps({ open: false }),
                        isDanger: true,
                        icon: 'warning',
                        disableSubmitButton: hasClaims,
                      })
                    },
                    rbac: [rbacDelete(clusterPool)],
                  },
                ]

                return (
                  <RbacDropdown<ClusterPool>
                    id={`${clusterPool.metadata.name}-actions`}
                    item={clusterPool}
                    isKebab={true}
                    text={t('Actions')}
                    actions={actions}
                  />
                )
              }
            },
          },
        ]}
        keyFn={mckeyFn}
        key="clusterPoolsTable"
        tableActions={[
          {
            id: 'updateReleaseImages',
            title: t('bulk.updateReleaseImages.clusterPools'),
            click: (clusterPools: ClusterPool[]) => {
              setUpdateReleaseImageModalProps({
                clusterPools,
                close: () => setUpdateReleaseImageModalProps(undefined),
              })
            },
            variant: 'bulk-action',
          },
          { id: 'seperator', variant: 'action-separator' },
          {
            id: 'destroyClusterPools',
            title: t('bulk.destroy.clusterPools'),
            click: (clusterPools: ClusterPool[]) => {
              let hasClaims = false
              clusterPools.forEach((clusterPool) => {
                const claimClusters = clusters.filter(
                  (cluster) => cluster.hive.clusterPool === clusterPool.metadata.name && cluster.hive.clusterClaimName
                )
                if (claimClusters.length > 0) {
                  hasClaims = true
                }
              })
              setModalProps({
                open: true,
                title: t('bulk.destroy.clusterPools'),
                action: t('destroy'),
                processing: t('destroying'),
                items: clusterPools,
                emptyState: undefined, // table action is only enabled when items are selected
                description: hasClaims
                  ? t('The cluster pool deletion will be blocked until all claimed cluster(s) are deleted.')
                  : t('bulk.message.destroyClusterPool'),
                columns: modalColumns,
                keyFn: mckeyFn,
                actionFn: deleteResource,
                close: () => setModalProps({ open: false }),
                isDanger: true,
                icon: 'warning',
                confirmText: t('confirm'),
                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                disableSubmitButton: hasClaims,
              })
            },
            variant: 'bulk-action',
          },
        ]}
        tableActionButtons={props.tableActionButtons}
        rowActions={[]}
        emptyState={props.emptyState}
      />
    </Fragment>
  )
}

const table = css({
  '& .pf-v6-c-table tr > *:first-child': {
    paddingLeft: '0 !important',
  },
})

function ClusterPoolClustersTable(props: { clusters: Cluster[] }) {
  const { t } = useTranslation()
  return (
    <div className={table}>
      <AcmTable<Cluster>
        noBorders
        keyFn={(cluster: Cluster) => cluster.name!}
        key="clusterPoolClustersTable"
        autoHidePagination
        showToolbar={false}
        items={props.clusters}
        emptyState={undefined} // only shown when cluster count > 0
        columns={[
          {
            header: t('table.name'),
            sort: 'displayName',
            cell: (cluster) => (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                {cluster.hive.clusterClaimName && (
                  <Content>
                    <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
                  </Content>
                )}
              </>
            ),
          },
          {
            header: t('table.status'),
            sort: 'status',
            search: 'status',
            cell: (cluster: Cluster) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <StatusField cluster={cluster} />
              </span>
            ),
          },
          {
            header: t('table.availableToClaim'),
            sort: 'hive',
            search: 'status',
            cell: (cluster: Cluster) => {
              const availableStatuses = [ClusterStatus.running]
              const isAvailable = !cluster.hive.clusterClaimName && availableStatuses.includes(cluster.status)
              return <span style={{ whiteSpace: 'nowrap' }}>{isAvailable ? t('Yes') : t('No')}</span>
            },
          },
        ]}
      />
    </div>
  )
}

function ClusterPoolClaimsTable(props: { claims: ClusterClaim[] }) {
  const { t } = useTranslation()
  const alertContext = useContext(AcmAlertContext)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ClusterClaim> | { open: false }>({
    open: false,
  })

  function deleteModal(claim: ClusterClaim) {
    setModalProps({
      open: true,
      title: t('clusterClaim.delete'),
      action: t('delete'),
      processing: t('deleting'),
      items: [claim],
      emptyState: undefined, // there is always 1 item supplied
      description: t('bulk.message.delete.claim'),
      keyFn: (claim) => claim.metadata.name as string,
      actionFn: (claim) => deleteClaim(claim),
      close: () => setModalProps({ open: false }),
      isDanger: true,
      icon: 'warning',
      confirmText: claim.metadata.name!,
      isValidError: errorIsNot([ResourceErrorCode.NotFound]),
    })
  }

  function deleteClaim(claim: ClusterClaim) {
    return {
      promise: deleteResource(claim).promise.catch((e) => {
        if (e instanceof Error) {
          alertContext.addAlert({
            type: 'danger',
            title: t('request.failed'),
            message: e.message,
          })
        }
        throw e
      }),
      abort: () => {
        setModalProps({ open: false })
      },
    }
  }

  return (
    <div className={table}>
      <BulkActionModal<ClusterClaim> {...modalProps} />
      <AcmTable<ClusterClaim>
        noBorders
        keyFn={(claim: ClusterClaim) => claim.metadata.name!}
        key="clusterPoolClaimsTable"
        autoHidePagination
        showToolbar={false}
        items={props.claims}
        emptyState={undefined} // only shown when cluster claims count > 0
        columns={[
          {
            header: t('table.name'),
            sort: 'displayName',
            cell: (claim) => (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>{claim.metadata.name}</span>
              </>
            ),
          },
          {
            header: t('table.status'),
            sort: 'status',
            search: 'status',
            cell: (claim: ClusterClaim) => (
              <span style={{ whiteSpace: 'nowrap' }}>{claim.status?.conditions ? 'Pending' : '-'}</span>
            ),
          },
          {
            header: t('table.createdBy'),
            sort: 'hive',
            cell: (claim: ClusterClaim) => {
              return claim.metadata.annotations ? (
                <div>
                  {Buffer.from(
                    claim.metadata.annotations!['open-cluster-management.io/user-identity'],
                    'base64'
                  ).toString('ascii')}
                </div>
              ) : (
                <span style={{ whiteSpace: 'nowrap' }}>-</span>
              )
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            cell: (claim: ClusterClaim) => {
              return (
                <AcmButton
                  id="deleteClaim"
                  variant="link"
                  style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
                  label={t('clusterClaim.delete')}
                  onClick={() => {
                    deleteModal(claim)
                  }}
                >
                  {t('clusterClaim.delete')}
                </AcmButton>
              )
            },
          },
        ]}
      />
    </div>
  )
}
