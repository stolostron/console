/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useCallback, useMemo, useState } from 'react'
import {
  ButtonVariant,
  ExpandableSectionToggle,
  Flex,
  FlexItem,
  Icon,
  ProgressStep,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon, PenIcon } from '@patternfly/react-icons'
import { NodePoolK8sResource, ClusterImageSetK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { TFunction } from 'react-i18next'
import NodePoolsTable from './NodePoolsTable'
import './HypershiftClusterInstallProgress.css'
import { NodePool, NodePoolDefinition } from '../../../../../resources/node-pool'
import { AcmButton } from '../../../../../ui-components'
import { AddNodePoolModal } from './AddNodePoolModal'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { HypershiftCloudPlatformType } from '../../../../../resources/utils/constants'
import { rbacCreate, useIsAnyNamespaceAuthorized } from '../../../../../lib/rbac-util'
import { onToggle } from '../utils/utils'

export type NodePoolStatus = {
  type: 'error' | 'pending' | 'ok' | 'warning'
  text: string
  icon: React.ReactNode
}

export const getNodePoolStatus = (nodePool: NodePoolK8sResource, t: TFunction): NodePoolStatus => {
  return nodePool.status?.conditions?.find(({ type }: { type: string }) => type === 'Ready')?.status === 'True'
    ? {
        type: 'ok',
        icon: (
          <Icon status="success">
            <CheckCircleIcon />
          </Icon>
        ),
        text: t('Ready'),
      }
    : {
        type: 'pending',
        icon: <InProgressIcon />,
        text: t('Not ready'),
      }
}

export const getNodePoolsStatus = (nodePools: NodePoolK8sResource[], t: TFunction): ReactNode => {
  const nodePoolMap = nodePools.reduce<{
    [key: string]: { status: NodePoolStatus }
  }>((acc, np) => {
    const status = getNodePoolStatus(np, t)
    acc[np.metadata?.uid || ''] = {
      status,
    }
    return acc
  }, {})

  const nodePoolsStatus: { type: string; icon: ReactNode } = {
    type: 'ok',
    icon: (
      <Icon status="success">
        <CheckCircleIcon />
      </Icon>
    ),
  }

  for (const property in nodePoolMap) {
    const { status } = nodePoolMap[property]
    if (status.type === 'pending') {
      nodePoolsStatus.type = 'pending'
      nodePoolsStatus.icon = <Spinner size="md" />
    }
  }
  return nodePoolsStatus.icon
}

type NodePoolsProgressProps = {
  nodePools: NodePoolK8sResource[]
  clusterImages: ClusterImageSetK8sResource[]
}

const NodePoolsProgress = ({ nodePools, ...rest }: NodePoolsProgressProps) => {
  const { t } = useTranslation()
  const nodePoolsProgressID = `${window.location.href}node-pools-progress`
  if (!localStorage.getItem(nodePoolsProgressID)) {
    localStorage.setItem(nodePoolsProgressID, 'show')
  }
  const [expanded, setExpanded] = useState(localStorage.getItem(nodePoolsProgressID) === 'show')
  const { cluster, hostedCluster } = useClusterDetailsContext()
  const [openAddNodepoolModal, toggleOpenAddNodepoolModal] = useState<boolean>(false)
  const toggleAddNodepoolModal = useCallback(
    () => toggleOpenAddNodepoolModal(!openAddNodepoolModal),
    [openAddNodepoolModal]
  )
  const canCreateNodepool = useIsAnyNamespaceAuthorized(rbacCreate(NodePoolDefinition))
  const nodepoolList = nodePools.map((nodePool) => nodePool.metadata?.name) as string[]

  const addNodePoolStatusMessage = useMemo(() => {
    if (hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS) {
      return t('Add node pool is only supported for AWS. Use the hcp CLI to add additional node pools.')
    }
    if (cluster?.hypershift?.isUpgrading) {
      return t('Node pools cannot be added during hosted cluster update.')
    }
    return t('rbac.unauthorized')
  }, [hostedCluster?.spec?.platform?.type, cluster?.hypershift?.isUpgrading, t])

  return (
    <ProgressStep icon={getNodePoolsStatus(nodePools, t)}>
      <AddNodePoolModal
        open={openAddNodepoolModal}
        close={toggleAddNodepoolModal}
        hostedCluster={hostedCluster}
        refNodepool={nodePools && nodePools.length > 0 ? (nodePools[0] as NodePool) : undefined}
        clusterImages={rest.clusterImages}
      />
      <Stack hasGutter>
        <StackItem>
          <Flex>
            <FlexItem>
              <ExpandableSectionToggle
                isExpanded={expanded}
                onToggle={() => onToggle(nodePoolsProgressID, expanded, setExpanded)}
                className="nodepool-progress-item__header"
              >
                {t('Cluster node pools')}
              </ExpandableSectionToggle>
            </FlexItem>
            {!expanded && (
              <FlexItem>
                {nodepoolList.map((nodePool) => (
                  <AcmButton
                    icon={<PenIcon />}
                    style={{ marginRight: '0.5em', fontSize: '0.8em', padding: '0.5em' }}
                    id={nodePool}
                    key={nodePool}
                    children={nodePool}
                    variant={ButtonVariant.tertiary}
                    onClick={() => setExpanded(true)}
                    iconPosition="right"
                  />
                ))}

                <AcmButton
                  id="addNodepoolEmptyState"
                  children={t('Add node pool')}
                  variant={ButtonVariant.link}
                  onClick={toggleAddNodepoolModal}
                  tooltip={addNodePoolStatusMessage}
                  isDisabled={
                    hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS ||
                    !canCreateNodepool ||
                    cluster?.hypershift?.isUpgrading
                  }
                />
              </FlexItem>
            )}
          </Flex>
        </StackItem>
        {expanded && (
          <StackItem className="nodepool-progress-item__body">
            <NodePoolsTable nodePools={nodePools as NodePool[]} {...rest} />
          </StackItem>
        )}
      </Stack>
    </ProgressStep>
  )
}

export default NodePoolsProgress
