/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { PageSection, Stack, StackItem, Flex, FlexItem, TextContent, Text, TextVariants } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
    AcmPageContent,
    AcmEmptyState,
    AcmTable,
    AcmInlineStatus,
    StatusType,
    AcmExpandableCard,
    AcmButton,
    AcmInlineProvider,
} from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ClusterSetContext } from '../ClusterSetDetails'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import { ManagedClusterAddOn } from '../../../../../resources/managed-cluster-add-on'
import { NavigationPath } from '../../../../../NavigationPath'
import { submarinerConfigsState } from '../../../../../atoms'
import { ManagedClusterSetDefinition } from '../../../../../resources/managed-cluster-set'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { deleteSubmarinerAddon } from '../../../../../lib/delete-submariner'
import { ResourceErrorCode } from '../../../../../lib/resource-request'
import { rbacDelete } from '../../../../../lib/rbac-util'
import { RbacDropdown } from '../../../../../components/Rbac'
import { EditSubmarinerConfigModal, EditSubmarinerConfigModalProps } from '../../components/EditSubmarinerConfigModal'

type SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'
const SubmarinerGatewayNodesLabeled: SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'

type SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'
const SubmarinerAgentDegraded: SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'

type SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'
const SubmarinerConnectionDegraded: SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'

export enum SubmarinerStatus {
    'progressing' = 'progressing',
    'healthy' = 'healthy',
    'degraded' = 'degraded',
}

export const submarinerHealthCheck = (mca: ManagedClusterAddOn) => {
    const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
    const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
    const nodeLabeledCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerGatewayNodesLabeled)

    const isConnectionProgressing = connectionDegradedCondition?.status === undefined
    const isAgentProgressing = agentCondition?.status === undefined
    const isNodeLabeledProgressing = nodeLabeledCondition?.status === undefined

    if (isConnectionProgressing || isAgentProgressing || isNodeLabeledProgressing) {
        return SubmarinerStatus.progressing
    } else {
        const isHealthyConnection = connectionDegradedCondition?.status === 'False'
        const isHealthyAgent = agentCondition?.status === 'False'
        const isNodeLabeled = nodeLabeledCondition?.status === 'True'

        if (isHealthyConnection && isHealthyAgent && isNodeLabeled) {
            return SubmarinerStatus.healthy
        } else {
            return SubmarinerStatus.degraded
        }
    }
}

export function ClusterSetSubmarinerPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const [submarinerConfigs] = useRecoilState(submarinerConfigsState)
    const { clusterSet, clusters, submarinerAddons } = useContext(ClusterSetContext)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterAddOn> | { open: false }>({
        open: false,
    })
    const [editSubmarinerConfigModalProps, setEditSubmarinerConfigModalProps] =
        useState<EditSubmarinerConfigModalProps>({})

    function keyFn(mca: ManagedClusterAddOn) {
        return mca.metadata.namespace!
    }

    const columns = [
        {
            header: t('table.cluster'),
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: (mca: ManagedClusterAddOn) => {
                const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
                return matchedCluster!.displayName
            },
        },
        {
            header: t('table.provider'),
            cell: (mca: ManagedClusterAddOn) => {
                const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
                return matchedCluster?.provider ? <AcmInlineProvider provider={matchedCluster!.provider!} /> : '-'
            },
        },
        {
            header: t('table.submariner.connection'),
            cell: (mca: ManagedClusterAddOn) => {
                const connectionDegradedCondition = mca.status?.conditions?.find(
                    (c) => c.type === SubmarinerConnectionDegraded
                )
                let type: StatusType = StatusType.progress
                let status: string = t('status.submariner.progressing')
                let message: string | undefined = t('status.submariner.progressing.message')
                if (connectionDegradedCondition) {
                    status =
                        connectionDegradedCondition?.status === 'True'
                            ? t('status.submariner.connection.degraded')
                            : t('status.submariner.connection.healthy')
                    type = connectionDegradedCondition?.status === 'True' ? StatusType.danger : StatusType.healthy
                    message = connectionDegradedCondition.message
                }
                return (
                    <AcmInlineStatus
                        type={type}
                        status={status}
                        popover={message ? { bodyContent: message } : undefined}
                    />
                )
            },
        },
        {
            header: t('table.submariner.agent'),
            cell: (mca: ManagedClusterAddOn) => {
                const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
                let type: StatusType = StatusType.progress
                let status: string = t('status.submariner.progressing')
                let message: string | undefined = t('status.submariner.progressing.message')
                if (agentCondition) {
                    status =
                        agentCondition?.status === 'True'
                            ? t('status.submariner.agent.degraded')
                            : t('status.submariner.agent.healthy')
                    type = agentCondition?.status === 'True' ? StatusType.danger : StatusType.healthy
                    message = agentCondition.message
                }
                return (
                    <AcmInlineStatus
                        type={type}
                        status={status}
                        popover={message ? { bodyContent: message } : undefined}
                    />
                )
            },
        },
        {
            header: t('table.submariner.nodes'),
            cell: (mca: ManagedClusterAddOn) => {
                const nodeLabeledCondition = mca.status?.conditions?.find(
                    (c) => c.type === SubmarinerGatewayNodesLabeled
                )
                let type: StatusType = StatusType.progress
                let status: string = t('status.submariner.progressing')
                let message: string | undefined = t('status.submariner.progressing.message')
                if (nodeLabeledCondition) {
                    status =
                        nodeLabeledCondition?.status === 'True'
                            ? t('status.submariner.nodes.labeled')
                            : t('status.submariner.nodes.notLabeled')
                    type = nodeLabeledCondition?.status === 'True' ? StatusType.healthy : StatusType.danger
                    message = nodeLabeledCondition.message
                }
                return (
                    <AcmInlineStatus
                        type={type}
                        status={status}
                        popover={message ? { bodyContent: message } : undefined}
                    />
                )
            },
        },
    ]

    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <EditSubmarinerConfigModal {...editSubmarinerConfigModalProps} />
                <BulkActionModel<ManagedClusterAddOn> {...modalProps} />
                <Stack hasGutter>
                    <StackItem>
                        <AcmExpandableCard title={t('multi-cluster.networking')} id="submariner-info">
                            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('submariner')}</Text>
                                        <Text component={TextVariants.p}>{t('learn.submariner')}</Text>
                                        <Text component={TextVariants.p}>
                                            <Trans
                                                i18nKey={'cluster:learn.submariner.additional'}
                                                components={{ bold: <strong /> }}
                                            />
                                        </Text>
                                    </TextContent>
                                </FlexItem>
                            </Flex>
                            <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                                <FlexItem>
                                    <AcmButton
                                        onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                                        variant="link"
                                        role="link"
                                        icon={<ExternalLinkAltIcon />}
                                        iconPosition="right"
                                    >
                                        {t('common:view.documentation')}
                                    </AcmButton>
                                </FlexItem>
                            </Flex>
                        </AcmExpandableCard>
                    </StackItem>
                    <StackItem>
                        <AcmTable<ManagedClusterAddOn>
                            plural="submariner addons"
                            items={submarinerAddons}
                            columns={[
                                ...columns,
                                {
                                    header: '',
                                    cellTransforms: [fitContent],
                                    cell: (mca: ManagedClusterAddOn) => {
                                        const submarinerConfig = submarinerConfigs.find(
                                            (sc) => sc.metadata.namespace === mca.metadata.namespace
                                        )
                                        const cluster = clusters?.find((c) => c.namespace === mca.metadata.namespace)
                                        const actions = [
                                            {
                                                id: 'uninstall-submariner',
                                                text: t('uninstall.add-on'),
                                                isDisabled: true,
                                                rbac: [rbacDelete(mca)],
                                                click: (mca: ManagedClusterAddOn) => {
                                                    setModalProps({
                                                        open: true,
                                                        title: t('bulk.title.uninstallSubmariner'),
                                                        action: t('common:uninstall'),
                                                        processing: t('common:uninstalling'),
                                                        resources: [mca],
                                                        description: t('bulk.message.uninstallSubmariner'),
                                                        columns,
                                                        keyFn: (mca) => mca.metadata.namespace as string,
                                                        actionFn: (managedClusterAddOn: ManagedClusterAddOn) => {
                                                            const submarinerConfig = submarinerConfigs.find(
                                                                (sc) =>
                                                                    sc.metadata.namespace ===
                                                                    managedClusterAddOn.metadata.namespace
                                                            )
                                                            return deleteSubmarinerAddon(
                                                                managedClusterAddOn,
                                                                submarinerConfig
                                                            )
                                                        },
                                                        close: () => setModalProps({ open: false }),
                                                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                                    })
                                                },
                                            },
                                        ]

                                        if (submarinerConfig !== undefined) {
                                            actions.unshift({
                                                id: 'edit-submariner-config',
                                                text: t('submariner.config.edit'),
                                                isDisabled: true,
                                                rbac: [rbacPatch(submarinerConfig!)],
                                                click: () => {
                                                    setEditSubmarinerConfigModalProps({
                                                        submarinerConfig,
                                                        cluster,
                                                        onClose: () => setEditSubmarinerConfigModalProps({}),
                                                    })
                                                },
                                            })
                                        }

                                        return (
                                            <RbacDropdown<ManagedClusterAddOn>
                                                id={`${mca.metadata.name}-actions`}
                                                item={mca}
                                                isKebab={true}
                                                text={`${mca.metadata.name}-actions`}
                                                actions={actions}
                                            />
                                        )
                                    },
                                },
                            ]}
                            keyFn={keyFn}
                            key="submarinerTable"
                            bulkActions={[
                                {
                                    id: 'uninstall-submariner',
                                    title: t('bulk.title.uninstallSubmariner.action'),
                                    click: (mcas: ManagedClusterAddOn[]) => {
                                        setModalProps({
                                            open: true,
                                            title: t('bulk.title.uninstallSubmariner'),
                                            action: t('common:uninstall'),
                                            processing: t('common:uninstalling'),
                                            resources: mcas,
                                            description: t('bulk.message.uninstallSubmariner'),
                                            columns,
                                            keyFn: (mca) => mca.metadata.namespace as string,
                                            actionFn: (managedClusterAddOn: ManagedClusterAddOn) => {
                                                const submarinerConfig = submarinerConfigs.find(
                                                    (sc) =>
                                                        sc.metadata.namespace === managedClusterAddOn.metadata.namespace
                                                )
                                                return deleteSubmarinerAddon(managedClusterAddOn, submarinerConfig)
                                            },
                                            close: () => setModalProps({ open: false }),
                                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                        })
                                    },
                                },
                            ]}
                            rowActions={[]}
                            tableActions={[
                                {
                                    id: 'install-submariner',
                                    title: t('managed.clusterSets.submariner.addons.install'),
                                    click: () =>
                                        history.push(
                                            NavigationPath.clusterSetSubmarinerInstall.replace(
                                                ':id',
                                                clusterSet?.metadata.name!
                                            )
                                        ),
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={
                                        clusters!.length === 0
                                            ? t('managed.clusterSets.clusters.emptyStateHeader')
                                            : t('empty-state.submariner.title')
                                    }
                                    message={
                                        clusters!.length === 0 ? (
                                            <Trans
                                                i18nKey={
                                                    'cluster:managed.clusterSets.submariner.clusters.emptyStateMsg'
                                                }
                                                components={{ bold: <strong />, p: <p /> }}
                                            />
                                        ) : (
                                            <Trans
                                                i18nKey={'cluster:managed.clusterSets.submariner.addons.emptyStateMsg'}
                                                components={{ bold: <strong />, p: <p /> }}
                                            />
                                        )
                                    }
                                    action={
                                        clusters!.length === 0 ? (
                                            <RbacButton
                                                component={Link}
                                                to={NavigationPath.clusterSetManage.replace(
                                                    ':id',
                                                    clusterSet!.metadata.name!
                                                )}
                                                variant="primary"
                                                rbac={[
                                                    rbacCreate(
                                                        ManagedClusterSetDefinition,
                                                        undefined,
                                                        clusterSet!.metadata.name,
                                                        'join'
                                                    ),
                                                ]}
                                            >
                                                {t('managed.clusterSets.clusters.emptyStateButton')}
                                            </RbacButton>
                                        ) : (
                                            <AcmButton
                                                id="install-submariner"
                                                variant="primary"
                                                onClick={() =>
                                                    history.push(
                                                        NavigationPath.clusterSetSubmarinerInstall.replace(
                                                            ':id',
                                                            clusterSet?.metadata.name!
                                                        )
                                                    )
                                                }
                                            >
                                                {t('managed.clusterSets.submariner.addons.install')}
                                            </AcmButton>
                                        )
                                    }
                                />
                            }
                        />
                    </StackItem>
                </Stack>
            </PageSection>
        </AcmPageContent>
    )
}
