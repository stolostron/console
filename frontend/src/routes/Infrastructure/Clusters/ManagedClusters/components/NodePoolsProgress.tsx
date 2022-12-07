/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import {
    ButtonVariant,
    ExpandableSectionToggle,
    Flex,
    FlexItem,
    ProgressStep,
    Spinner,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { NodePoolK8sResource, ClusterImageSetK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { TFunction } from 'i18next'
import NodePoolsTable from './NodePoolsTable'
import './HypershiftClusterInstallProgress.css'
import { NodePool, NodePoolDefinition } from '../../../../../resources/node-pool'
import { AcmButton, AcmLabels } from '../../../../../ui-components'
import { AddNodePoolModal } from './AddNodePoolModal'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { HypershiftCloudPlatformType } from '../../../../../resources/utils/constants'
import { checkPermission, rbacCreate } from '../../../../../lib/rbac-util'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'

export type NodePoolStatus = {
    type: 'error' | 'pending' | 'ok' | 'warning'
    text: string
    icon: React.ReactNode
}

export const getNodePoolStatus = (nodePool: NodePoolK8sResource, t: TFunction): NodePoolStatus => {
    return nodePool.status?.conditions?.find(({ type }: { type: string }) => type === 'Ready')?.status === 'True'
        ? {
              type: 'ok',
              icon: <CheckCircleIcon color={okColor.value} />,
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
        icon: <CheckCircleIcon color={okColor.value} />,
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

const NodePoolsProgress = ({ nodePools, clusterImages, ...rest }: NodePoolsProgressProps) => {
    const { t } = useTranslation()
    const [isExpanded, setExpanded] = useState(true)
    const { hostedCluster } = useContext(ClusterContext)
    const [openAddNodepoolModal, toggleOpenAddNodepoolModal] = useState<boolean>(false)
    const toggleAddNodepoolModal = useCallback(
        () => toggleOpenAddNodepoolModal(!openAddNodepoolModal),
        [openAddNodepoolModal]
    )
    const [canCreateNodepool, setCanCreateNodepool] = useState<boolean>(false)
    const { namespacesState } = useSharedAtoms()
    const [namespaces] = useRecoilState(namespacesState)
    const nodepoolList = nodePools.map((nodePool) => nodePool.metadata?.name) as string[]
    // const nodepoolList2 = [
    //     'dsfvcdfefdfd',
    //     'dsfsfdsfdfdf',
    //     'dssdfdsfdsfds',
    //     'efvbfdewefgf',
    //     'sdfbefbfwsfdf',
    //     'dsfdfdsfdfdf',
    //     'fvbdfvddfbff',
    //     'dsfdfdfdsfdgfrefdvgrthgrgvfgbgbn',
    //     'sffdvdcvfdgreferrfger',
    //     'dsfdfdfdgfdcve',
    //     'erthnbvdcseretyjj',
    //     'defgbfwqefgbdvfvfvf',
    // ]

    useEffect(() => {
        checkPermission(rbacCreate(NodePoolDefinition), setCanCreateNodepool, namespaces)
    }, [namespaces])

    return (
        <ProgressStep icon={getNodePoolsStatus(nodePools, t)}>
            <AddNodePoolModal
                open={openAddNodepoolModal}
                close={toggleAddNodepoolModal}
                hostedCluster={hostedCluster!}
                refNodepool={nodePools && nodePools.length > 0 ? nodePools[0] : undefined}
                clusterImages={clusterImages}
            />
            <Stack hasGutter>
                <StackItem>
                    <Flex>
                        <FlexItem>
                            <ExpandableSectionToggle
                                isExpanded={isExpanded}
                                onToggle={setExpanded}
                                className="nodepool-progress-item__header"
                            >
                                {t('Cluster node pools')}
                            </ExpandableSectionToggle>
                        </FlexItem>
                        {!isExpanded && (
                            <FlexItem>
                                <AcmLabels
                                    labels={nodepoolList}
                                    expandedText={t('show.less')}
                                    collapsedText={t('show.more', { number: nodepoolList.length })}
                                    allCollapsedText={t('count.labels', { number: nodepoolList.length })}
                                    collapse={nodepoolList}
                                />
                                <AcmButton
                                    style={{}}
                                    id="addNodepoolEmptyState"
                                    children={t('Add node pool')}
                                    variant={ButtonVariant.link}
                                    onClick={() => toggleAddNodepoolModal()}
                                    tooltip={
                                        hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS
                                            ? t(
                                                  'Add node pool is only supported for AWS. Use the HyperShift CLI to add additional node pools.'
                                              )
                                            : t('rbac.unauthorized')
                                    }
                                    isDisabled={
                                        hostedCluster?.spec?.platform?.type !== HypershiftCloudPlatformType.AWS ||
                                        !canCreateNodepool
                                    }
                                />
                            </FlexItem>
                        )}
                    </Flex>
                </StackItem>
                {isExpanded && (
                    <StackItem className="nodepool-progress-item__body">
                        <NodePoolsTable nodePools={nodePools as NodePool[]} {...rest} />
                    </StackItem>
                )}
            </Stack>
        </ProgressStep>
    )
}

export default NodePoolsProgress
