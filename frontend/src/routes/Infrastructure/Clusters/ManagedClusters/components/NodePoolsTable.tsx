/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Flex, FlexItem, Icon, List, ListItem, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, UnknownIcon } from '@patternfly/react-icons'
import { useCallback, useContext, useMemo, useState } from 'react'
import { ClusterImageSetK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  AcmButton,
  AcmEmptyState,
  AcmInlineStatus,
  AcmTable,
  IAcmRowAction,
  IAcmTableColumn,
  StatusType,
} from '../../../../../ui-components'
import { getNodePoolStatus, NodePool, NodePoolCondition, NodePoolDefinition } from '../../../../../resources'
import { HypershiftCloudPlatformType } from '../../../../../resources/utils'
import { get } from 'lodash'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { DistributionField } from './DistributionField'
import { AddNodePoolModal } from './AddNodePoolModal'
import { IManageNodePoolNodesModalProps, ManageNodePoolNodesModal } from './ManageNodePoolNodesModal'
import { IRemoveNodePoolModalProps, RemoveNodePoolModal } from './RemoveNodePoolModal'
import { rbacCreate, rbacDelete, rbacPatch, useIsAnyNamespaceAuthorized } from '../../../../../lib/rbac-util'

import { NodePoolTableWidthContext } from './HypershiftClusterInstallProgress'

type NodePoolsTableProps = {
  nodePools: NodePool[]
  clusterImages: ClusterImageSetK8sResource[]
}

const STATUS_TYPE_MAP: Record<string, StatusType> = {
  error: StatusType.danger,
  warning: StatusType.warning,
  updating: StatusType.progress,
  pending: StatusType.progress,
  ok: StatusType.healthy,
}

const STATUS_LABEL_MAP: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  updating: 'Updating',
  pending: 'Pending',
  ok: 'Ready',
}

function ConditionIcon({ status }: { status: string }) {
  if (status === 'True') {
    return (
      <Icon status="success" size="sm">
        <CheckCircleIcon />
      </Icon>
    )
  }
  if (status === 'False') {
    return (
      <Icon status="danger" size="sm">
        <ExclamationCircleIcon />
      </Icon>
    )
  }
  return (
    <Icon size="sm">
      <UnknownIcon />
    </Icon>
  )
}

function NodePoolConditionsList({ conditions }: { conditions: NodePoolCondition[] }) {
  if (conditions.length === 0) {
    return null
  }
  return (
    <List isPlain>
      {conditions.map((c) => (
        <ListItem key={c.type}>
          <Flex
            spaceItems={{ default: 'spaceItemsXs' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'nowrap' }}
          >
            <FlexItem>
              <ConditionIcon status={c.status} />
            </FlexItem>
            <FlexItem>
              <strong>{c.type}</strong>
              {c.message ? `: ${c.message}` : ''}
            </FlexItem>
          </Flex>
        </ListItem>
      ))}
    </List>
  )
}

const NodePoolsTable = ({ nodePools, clusterImages }: NodePoolsTableProps): JSX.Element => {
  const { t } = useTranslation()
  const { cluster, hostedCluster } = useClusterDetailsContext()
  const [openAddNodepoolModal, toggleOpenAddNodepoolModal] = useState<boolean>(false)
  const toggleAddNodepoolModal = useCallback(
    () => toggleOpenAddNodepoolModal(!openAddNodepoolModal),
    [openAddNodepoolModal]
  )
  const [manageNodepoolModalProps, setManageNodepoolModalProps] = useState<
    IManageNodePoolNodesModalProps | { open: false }
  >({
    open: false,
  })
  const [removeNodepoolModalProps, setRemoveNodepoolModalProps] = useState<IRemoveNodePoolModalProps | { open: false }>(
    {
      open: false,
    }
  )
  const canCreateNodepool = useIsAnyNamespaceAuthorized(rbacCreate(NodePoolDefinition))
  const canDeleteNodepool = useIsAnyNamespaceAuthorized(rbacDelete(NodePoolDefinition))
  const canPatchNodepool = useIsAnyNamespaceAuthorized(rbacPatch(NodePoolDefinition))

  const renderNodepoolStatus = useCallback(
    (nodepool: NodePool) => {
      const status = getNodePoolStatus(nodepool)
      const acmStatusType = STATUS_TYPE_MAP[status.type] ?? StatusType.unknown
      const label = t(STATUS_LABEL_MAP[status.type] ?? 'Unknown')
      const hasConditions = status.conditions.length > 0

      return (
        <AcmInlineStatus
          type={acmStatusType}
          status={label}
          popover={
            hasConditions
              ? {
                  headerContent: status.type !== 'ok' ? status.statusText : t('Conditions'),
                  bodyContent: <NodePoolConditionsList conditions={status.conditions} />,
                }
              : undefined
          }
        />
      )
    },
    [t]
  )

  const renderHealthCheck = useCallback(
    (nodepool: NodePool) => {
      const healthCheck = get(nodepool, 'spec.management.autoRepair', false) ? t('True') : t('False')

      return <span>{healthCheck}</span>
    },
    [t]
  )

  const getAutoscaling = useCallback(
    (nodepool: NodePool) => {
      const autoscaling = get(nodepool, 'spec.autoScaling')
      if (!autoscaling) {
        return t('False')
      }

      const min = autoscaling.min || 1
      const max = autoscaling.max || 1

      return t('Min {{min}} Max {{max}}', { min, max })
    },
    [t]
  )

  // Need to dynamically add columns when we add support for other clouds ie. Azure
  const columns = useMemo<IAcmTableColumn<NodePool>[]>(() => {
    const npColumns = []

    npColumns.push(
      {
        header: t('Node pool'),
        sort: 'metadata.name',
        search: 'metadata.name',
        cell: 'metadata.name',
      },
      {
        header: t('Status'),
        sort: 'transformed.status',
        search: 'transformed.status',
        cell: (nodepool: NodePool) => renderNodepoolStatus(nodepool),
      },
      {
        header: t('table.distribution'),
        sort: 'status.version',
        search: 'status.version',
        cell: (nodepool: NodePool) => <DistributionField cluster={cluster} nodepool={nodepool} resource={'nodepool'} />,
      }
    )
    if (hostedCluster?.spec?.platform?.type === HypershiftCloudPlatformType.AWS) {
      npColumns.push(
        {
          header: t('Subnet'),
          sort: 'spec.platform.aws.subnet.id',
          search: 'spec.platform.aws.subnet.id',
          cell: 'spec.platform.aws.subnet.id',
        },
        {
          header: t('Instance type'),
          sort: 'spec.platform.aws.instanceType',
          search: 'spec.platform.aws.instanceType',
          cell: 'spec.platform.aws.instanceType',
        }
      )
    }
    if (hostedCluster?.spec?.platform?.type === HypershiftCloudPlatformType.Azure) {
      npColumns.push(
        {
          header: t('Disk storage account type'),
          sort: 'spec.platform.azure.diskStorageAccountType',
          search: 'spec.platform.azure.diskStorageAccountType',
          cell: 'spec.platform.azure.diskStorageAccountType',
        },
        {
          header: t('VM size'),
          sort: 'spec.platform.azure.vmsize',
          search: 'spec.platform.azure.vmsize',
          cell: 'spec.platform.azure.vmsize',
        }
      )
    }
    if (hostedCluster?.spec?.platform?.type === HypershiftCloudPlatformType.PowerVS) {
      npColumns.push(
        {
          header: t('Processor type'),
          sort: 'spec.platform.powervs.processorType',
          search: 'spec.platform.powervs.processorType',
          cell: 'spec.platform.powervs.processorType',
        },
        {
          header: t('System type'),
          sort: 'spec.platform.powervs.systemType',
          search: 'spec.platform.powervs.systemType',
          cell: 'spec.platform.powervs.systemType',
        }
      )
    }
    if (hostedCluster?.spec?.platform?.type === HypershiftCloudPlatformType.KubeVirt) {
      npColumns.push(
        {
          header: t('Root volume'),
          sort: 'spec.platform.kubevirt.rootVolume.persistent.size',
          search: 'spec.platform.kubevirt.rootVolume.persistent.size',
          cell: 'spec.platform.kubevirt.rootVolume.persistent.size',
        },
        {
          header: t('Compute core'),
          sort: 'spec.platform.kubevirt.compute.cores',
          search: 'spec.platform.kubevirt.compute.cores',
          cell: 'spec.platform.kubevirt.compute.cores',
        },
        {
          header: t('Compute memory'),
          sort: 'spec.platform.kubevirt.compute.memory',
          search: 'spec.platform.kubevirt.compute.memory',
          cell: 'spec.platform.kubevirt.compute.memory',
        }
      )
    }
    npColumns.push(
      {
        header: t('Nodes'),
        sort: 'spec.replicas',
        search: 'spec.replicas',
        cell: 'spec.replicas',
      },
      {
        header: t('Health check'),
        sort: 'spec.management.autoRepair',
        search: 'spec.management.autoRepair',
        cell: (nodepool: NodePool) => renderHealthCheck(nodepool),
      },
      {
        header: t('Update type'),
        sort: 'spec.management.upgradeType',
        search: 'spec.management.upgradeType',
        cell: 'spec.management.upgradeType',
      },
      {
        header: t('Autoscaling'),
        sort: 'transformed.autoscaling',
        search: 'transformed.autoscaling',
        cell: (nodepool: NodePool) => getAutoscaling(nodepool),
      }
    )

    return npColumns
  }, [renderNodepoolStatus, renderHealthCheck, getAutoscaling, t, cluster, hostedCluster?.spec?.platform?.type])

  const keyFn = useCallback(
    (nodepool: NodePool) => nodepool.metadata.uid ?? `${nodepool.metadata.namespace}/${nodepool.metadata.name}`,
    []
  )

  const generateTransformedData = useCallback(
    (nodepool: NodePool) => {
      const transformedObject = {
        transformed: {
          status: STATUS_LABEL_MAP[getNodePoolStatus(nodepool).type] ?? 'Unknown',
          autoscaling: getAutoscaling(nodepool),
        },
      }

      return { ...nodepool, ...transformedObject }
    },
    [getAutoscaling]
  )

  const addNodePoolStatusMessage = useMemo(() => {
    if (hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS) {
      return t('Add node pool is only supported for AWS. Use the hcp CLI to add additional node pools.')
    }
    if (cluster?.hypershift?.isUpgrading) {
      return t('Node pools cannot be added during hosted cluster update.')
    }
    return t('rbac.unauthorized')
  }, [hostedCluster?.spec?.platform?.type, cluster?.hypershift?.isUpgrading, t])

  const transformedNodepoolItems = useMemo(
    () => nodePools.map(generateTransformedData),
    [nodePools, generateTransformedData]
  )

  const rowActionResolver = useCallback(
    (nodepool: NodePool) => {
      const actions: IAcmRowAction<any>[] = []

      actions.push({
        id: 'manageNodepool',
        title: t('Manage node pool'),
        click: () => {
          if (hostedCluster) {
            setManageNodepoolModalProps({
              cluster,
              open: true,
              close: () => {
                setManageNodepoolModalProps({ open: false })
              },
              hostedCluster,
              nodepool,
            })
          }
        },
        tooltip: cluster?.hypershift?.isUpgrading
          ? t('Node pools cannot be managed during hosted cluster update.')
          : '',
        isDisabled: !canPatchNodepool || cluster?.hypershift?.isUpgrading,
      })

      actions.push({
        id: 'removeNodepool',
        title: t('Remove node pool'),
        click: () => {
          setRemoveNodepoolModalProps({
            open: true,
            close: () => {
              setRemoveNodepoolModalProps({ open: false })
            },
            nodepool,
            nodepoolCount: nodePools.length,
          })
        },
        isDisabled: !canDeleteNodepool,
      })

      return actions
    },
    [t, cluster, canPatchNodepool, canDeleteNodepool, hostedCluster, nodePools.length]
  )

  const addNodepoolButton = useMemo(
    () => (
      <AcmButton
        id="addNodepoolEmptyState"
        children={t('Add node pool')}
        variant={ButtonVariant.secondary}
        onClick={toggleAddNodepoolModal}
        tooltip={addNodePoolStatusMessage}
        isDisabled={
          hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS ||
          !canCreateNodepool ||
          cluster?.hypershift?.isUpgrading
        }
      />
    ),
    [
      toggleAddNodepoolModal,
      hostedCluster?.spec?.platform?.type,
      t,
      canCreateNodepool,
      cluster?.hypershift?.isUpgrading,
      addNodePoolStatusMessage,
    ]
  )

  const npTableWidth = useContext(NodePoolTableWidthContext)

  return (
    <>
      <RemoveNodePoolModal {...removeNodepoolModalProps} />
      <ManageNodePoolNodesModal {...manageNodepoolModalProps} />
      <AddNodePoolModal
        open={openAddNodepoolModal}
        close={toggleAddNodepoolModal}
        cluster={cluster}
        hostedCluster={hostedCluster}
        refNodepool={nodePools && nodePools.length > 0 ? nodePools[0] : undefined}
        clusterImages={clusterImages}
      />
      <Stack hasGutter>
        <StackItem style={{ width: npTableWidth }}>
          <AcmTable<NodePool>
            key="nodepool-table"
            columns={columns}
            keyFn={keyFn}
            items={transformedNodepoolItems}
            tableActionButtons={[
              {
                id: 'addNodepool',
                title: t('Add node pool'),
                click: () => toggleAddNodepoolModal(),
                isDisabled:
                  hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS ||
                  !canCreateNodepool ||
                  cluster?.hypershift?.isUpgrading,
                tooltip: addNodePoolStatusMessage,
                variant: ButtonVariant.secondary,
              },
            ]}
            rowActionResolver={rowActionResolver}
            emptyState={
              <AcmEmptyState
                key="nodepoolTableEmptyState"
                title={t("You don't have any node pools yet")}
                message={t('To get started, add a node pool.')}
                action={<>{addNodepoolButton}</>}
              />
            }
          />
        </StackItem>
      </Stack>
    </>
  )
}

export default NodePoolsTable
