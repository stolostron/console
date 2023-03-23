/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Stack, StackItem, Text } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ClusterImageSetK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation, Trans } from '../../../../../lib/acm-i18next'
import { AcmButton, AcmEmptyState, AcmTable, IAcmRowAction, IAcmTableColumn } from '../../../../../ui-components'
import { HypershiftCloudPlatformType, NodePool, NodePoolDefinition } from '../../../../../resources'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { get } from 'lodash'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { DistributionField } from './DistributionField'
import { AddNodePoolModal } from './AddNodePoolModal'
import { IManageNodePoolNodesModalProps, ManageNodePoolNodesModal } from './ManageNodePoolNodesModal'
import { IRemoveNodePoolModalProps, RemoveNodePoolModal } from './RemoveNodePoolModal'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { checkPermission, rbacCreate, rbacDelete, rbacPatch } from '../../../../../lib/rbac-util'

import { NodePoolTableWidthContext } from './HypershiftClusterInstallProgress'

type NodePoolsTableProps = {
  nodePools: NodePool[]
  clusterImages: ClusterImageSetK8sResource[]
}

const NodePoolsTable = ({ nodePools, clusterImages }: NodePoolsTableProps): JSX.Element => {
  const { t } = useTranslation()
  const { cluster, hostedCluster } = useContext(ClusterContext)
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
  const [canCreateNodepool, setCanCreateNodepool] = useState<boolean>(false)
  const [canDeleteNodepool, setCanDeleteNodepool] = useState<boolean>(false)
  const [canPatchNodepool, setCanPatchNodepool] = useState<boolean>(false)
  const { namespacesState } = useSharedAtoms()
  const [namespaces] = useRecoilState(namespacesState)

  const getNodepoolStatus = useCallback((nodepool: NodePool) => {
    const conditions = nodepool.status?.conditions || []

    for (const condition of conditions) {
      if (condition.type === 'Ready') {
        return condition.status === 'True' ? 'Ready' : 'Pending'
      }
    }
  }, [])

  const renderNodepoolStatus = useCallback(
    (nodepool: NodePool) => {
      const status = getNodepoolStatus(nodepool)

      if (status === 'Ready') {
        return (
          <span>
            <CheckCircleIcon color={okColor.value} /> {t('Ready')}
          </span>
        )
      }
      if (status === 'Pending') {
        return (
          <span>
            <InProgressIcon /> {t('Pending')}
          </span>
        )
      }
    },
    [getNodepoolStatus, t]
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
          sort: 'spec.platform.kubevirt.rootVolume',
          search: 'spec.platform.kubevirt.rootVolume',
          cell: 'spec.platform.kubevirt.rootVolume',
        },
        {
          header: t('Compute'),
          sort: 'spec.platform.kubevirt.compute',
          search: 'spec.platform.kubevirt.compute',
          cell: 'spec.platform.kubevirt.compute',
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
        header: t('Upgrade type'),
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
          status: getNodepoolStatus(nodepool),
          autoscaling: getAutoscaling(nodepool),
        },
      }

      return { ...nodepool, ...transformedObject }
    },
    [getNodepoolStatus, getAutoscaling]
  )

  const addNodePoolStatusMessage = useMemo(() => {
    if (hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS) {
      return t('Add node pool is only supported for AWS. Use the HyperShift CLI to add additional node pools.')
    }
    if (cluster?.hypershift?.isUpgrading) {
      return t('Node pools cannot be added during hosted cluster upgrade.')
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
          !!hostedCluster &&
            setManageNodepoolModalProps({
              open: true,
              close: () => {
                setManageNodepoolModalProps({ open: false })
              },
              hostedCluster,
              nodepool,
            })
        },
        tooltip: cluster?.hypershift?.isUpgrading
          ? t('Node pools cannot be managed during hosted cluster upgrade.')
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
    [hostedCluster, nodePools.length, t, canDeleteNodepool, canPatchNodepool, cluster?.hypershift?.isUpgrading]
  )

  useEffect(() => {
    checkPermission(rbacCreate(NodePoolDefinition), setCanCreateNodepool, namespaces)
  }, [namespaces])
  useEffect(() => {
    checkPermission(rbacDelete(NodePoolDefinition), setCanDeleteNodepool, namespaces)
  }, [namespaces])
  useEffect(() => {
    checkPermission(rbacPatch(NodePoolDefinition), setCanPatchNodepool, namespaces)
  }, [namespaces])

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
        hostedCluster={hostedCluster!}
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
                title={t("You don't have any node pools")}
                message={
                  <Text>
                    <Trans
                      i18nKey="Click <bold>Add node pool</bold> to create your resource."
                      components={{ bold: <strong /> }}
                    />
                  </Text>
                }
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
