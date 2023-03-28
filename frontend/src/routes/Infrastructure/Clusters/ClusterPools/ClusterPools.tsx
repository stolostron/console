/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import {
  ButtonVariant,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import {
  AcmAlertContext,
  AcmButton,
  AcmEmptyState,
  AcmExpandableCard,
  AcmInlineProvider,
  AcmPageContent,
  AcmTable,
  IAcmTableButtonAction,
  Provider,
} from '../../../../ui-components'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, useSharedAtoms, useSharedRecoil } from '../../../../shared-recoil'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../components/BulkActionModal'
import { RbacButton, RbacDropdown } from '../../../../components/Rbac'
import { TechPreviewAlert } from '../../../../components/TechPreviewAlert'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { createBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import {
  Cluster,
  ClusterClaim,
  ClusterClaimDefinition,
  ClusterPool,
  ClusterStatus,
  deleteResource,
  ResourceErrorCode,
} from '../../../../resources'
import { ClusterStatuses } from '../ClusterSets/components/ClusterStatuses'
import { StatusField } from '../ManagedClusters/components/StatusField'
import { useAllClusters } from '../ManagedClusters/components/useAllClusters'
import { ClusterClaimModal, ClusterClaimModalProps } from './components/ClusterClaimModal'
import { ScaleClusterPoolModal, ScaleClusterPoolModalProps } from './components/ScaleClusterPoolModal'
import { UpdateReleaseImageModal, UpdateReleaseImageModalProps } from './components/UpdateReleaseImageModal'

export default function ClusterPoolsPage() {
  const alertContext = useContext(AcmAlertContext)
  const history = useHistory()
  const { t } = useTranslation()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])
  const { waitForAll } = useSharedRecoil()
  const { clusterImageSetsState, clusterPoolsState } = useSharedAtoms()
  const [clusterPools] = useRecoilValue(waitForAll([clusterPoolsState, clusterImageSetsState]))

  /* t('preview.clusterPools') */
  return (
    <AcmPageContent id="clusters">
      <PageSection>
        <TechPreviewAlert i18nKey="preview.clusterPools" docHref={DOC_LINKS.CLUSTER_POOLS} />
        <Stack hasGutter style={{ height: 'unset' }}>
          <AcmExpandableCard title={t('learn.terminology')} id="cluster-pools-learn">
            <Flex style={{ flexWrap: 'inherit' }}>
              <Flex style={{ maxWidth: '50%' }}>
                <FlexItem>
                  <TextContent>
                    <Text component={TextVariants.h4}>{t('clusterPools')}</Text>
                    <Text component={TextVariants.p}>{t('learn.clusterPools')}</Text>
                  </TextContent>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_POOLS, '_blank')}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('view.documentation')}
                  </AcmButton>
                </FlexItem>
              </Flex>
              <Flex>
                <FlexItem>
                  <TextContent>
                    <Text component={TextVariants.h4}>{t('clusterClaims')}</Text>
                    <Text component={TextVariants.p}>{t('learn.clusterClaims')}</Text>
                  </TextContent>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_CLAIMS, '_blank')}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('view.documentation')}
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
                  click: () => history.push(createBackCancelLocation(NavigationPath.createClusterPool)),
                  variant: ButtonVariant.primary,
                },
              ]}
              emptyState={
                <AcmEmptyState
                  key="mcEmptyState"
                  title={t('managed.clusterPools.emptyStateHeader')}
                  message={
                    <Trans i18nKey="managed.clusterPools.emptyStateMsg" components={{ bold: <strong />, p: <p /> }} />
                  }
                  action={
                    <div>
                      <AcmButton
                        role="link"
                        onClick={() => history.push(createBackCancelLocation(NavigationPath.createClusterPool))}
                      >
                        {t('managed.createClusterPool')}
                      </AcmButton>
                      <TextContent>{viewDocumentation(DOC_LINKS.CLUSTER_POOLS, t)}</TextContent>
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

function ClusterPoolProvider(props: { clusterPool: ClusterPool }) {
  let provider: Provider | undefined
  if (props.clusterPool.spec?.platform?.aws) provider = Provider.aws
  if (props.clusterPool.spec?.platform?.gcp) provider = Provider.gcp
  if (props.clusterPool.spec?.platform?.azure) provider = Provider.azure

  if (!provider) return <>-</>

  return <AcmInlineProvider provider={provider} />
}

export function ClusterPoolsTable(props: {
  clusterPools: ClusterPool[]
  emptyState: React.ReactNode
  tableActionButtons?: IAcmTableButtonAction[]
}) {
  const { waitForAll } = useSharedRecoil()
  const { clusterImageSetsState, clusterClaimsState } = useSharedAtoms()
  const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
  const [clusterClaims] = useRecoilValue(waitForAll([clusterClaimsState]))

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

  const clusters = useAllClusters()

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

  return (
    <Fragment>
      <BulkActionModal<ClusterPool> {...modalProps} />
      <ClusterClaimModal {...clusterClaimModalProps} />
      <ScaleClusterPoolModal {...scaleClusterPoolModalProps} />
      <UpdateReleaseImageModal {...updateReleaseImageModalProps} />
      <AcmTable<ClusterPool>
        items={clusterPools}
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
                      <TextContent>
                        <Text component={TextVariants.h3}>{t('clusterPool.clusters')}</Text>
                      </TextContent>
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
                      <TextContent>
                        <Text component={TextVariants.h3}>{t('pending.cluster.claims')}</Text>
                      </TextContent>
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
            header: t('table.cluster.statuses'),
            cell: (clusterPool: ClusterPool) => {
              return <ClusterStatuses clusterPool={clusterPool} />
            },
          },
          {
            header: t('table.available'),
            cell: (clusterPool: ClusterPool) => {
              const ready = clusterPool?.status?.ready === undefined ? 0 : clusterPool?.status?.ready
              return (
                <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
                  {t('outOf', {
                    firstNumber: ready,
                    secondNumber: clusterPool.spec!.size,
                  })}
                </span>
              )
            },
          },
          {
            header: t('table.provider'),
            cell: (clusterPool: ClusterPool) => {
              return <ClusterPoolProvider clusterPool={clusterPool} />
            },
          },
          {
            header: t('table.distribution'),
            sort: 'spec.imageSetRef.name',
            search: 'spec.imageSetRef.name',
            cell: (clusterPool: ClusterPool) => {
              const imageSetRef = clusterPool.spec!.imageSetRef.name
              const imageSet = clusterImageSets.find((cis) => cis.metadata.name === imageSetRef)
              const releaseImage = imageSet?.spec?.releaseImage
              const tagStartIndex = releaseImage?.indexOf(':') ?? 0
              const version = releaseImage?.slice(tagStartIndex + 1, releaseImage.indexOf('-', tagStartIndex))
              return version ? `OpenShift ${version}` : '-'
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            cell: (clusterPool: ClusterPool) => {
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
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            cell: (clusterPool: ClusterPool) => {
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
                    setModalProps({
                      open: true,
                      title: t('bulk.title.destroyClusterPool'),
                      action: t('destroy'),
                      processing: t('destroying'),
                      items: [clusterPool],
                      emptyState: undefined, // there is always 1 item supplied
                      description: t('bulk.message.destroyClusterPool'),
                      columns: modalColumns,
                      keyFn: mckeyFn,
                      actionFn: deleteResource,
                      confirmText: clusterPool.metadata.name!,
                      close: () => setModalProps({ open: false }),
                      isDanger: true,
                      icon: 'warning',
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
                  text={`${clusterPool.metadata.name}-actions`}
                  actions={actions}
                />
              )
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
          { id: 'seperator', variant: 'action-seperator' },
          {
            id: 'destroyClusterPools',
            title: t('bulk.destroy.clusterPools'),
            click: (clusterPools: ClusterPool[]) => {
              setModalProps({
                open: true,
                title: t('bulk.destroy.clusterPools'),
                action: t('destroy'),
                processing: t('destroying'),
                items: clusterPools,
                emptyState: undefined, // table action is only enabled when items are selected
                description: t('bulk.message.destroyClusterPool'),
                columns: modalColumns,
                keyFn: mckeyFn,
                actionFn: deleteResource,
                close: () => setModalProps({ open: false }),
                isDanger: true,
                icon: 'warning',
                confirmText: t('confirm'),
                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
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

const useStyles = makeStyles({
  table: {
    '& .pf-c-table tr > *:first-child': {
      paddingLeft: '0 !important',
    },
  },
})

function ClusterPoolClustersTable(props: { clusters: Cluster[] }) {
  const { t } = useTranslation()
  const classes = useStyles()
  return (
    <div className={classes.table}>
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
                  <TextContent>
                    <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                  </TextContent>
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
  const classes = useStyles()
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
    <div className={classes.table}>
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
