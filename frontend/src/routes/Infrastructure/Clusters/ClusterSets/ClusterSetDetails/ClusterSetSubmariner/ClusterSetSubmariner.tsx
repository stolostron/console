/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterAddOn, ManagedClusterSetDefinition, ResourceErrorCode } from '../../../../../../resources'
import {
    AcmButton,
    AcmEmptyState,
    AcmExpandableCard,
    AcmInlineProvider,
    AcmInlineStatus,
    AcmPageContent,
    AcmTable,
    StatusType,
} from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    Flex,
    FlexItem,
    PageSection,
    Stack,
    StackItem,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { useContext, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { submarinerConfigsState } from '../../../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../../components/BulkActionModel'
import { RbacButton, RbacDropdown } from '../../../../../../components/Rbac'
import { deleteSubmarinerAddon } from '../../../../../../lib/delete-submariner'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { EditSubmarinerConfigModal, EditSubmarinerConfigModalProps } from '../../components/EditSubmarinerConfigModal'
import { ClusterSetContext } from '../ClusterSetDetails'

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
    const { t } = useTranslation()
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
            header: t('Cluster'),
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: (mca: ManagedClusterAddOn) => {
                const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
                return matchedCluster!.displayName
            },
        },
        {
            header: t('Infrastructure provider'),
            cell: (mca: ManagedClusterAddOn) => {
                const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
                return matchedCluster?.provider ? <AcmInlineProvider provider={matchedCluster!.provider!} /> : '-'
            },
        },
        {
            header: t('Connection status'),
            cell: (mca: ManagedClusterAddOn) => {
                const connectionDegradedCondition = mca.status?.conditions?.find(
                    (c) => c.type === SubmarinerConnectionDegraded
                )
                let type: StatusType = StatusType.progress
                let status: string = t('Progressing')
                let message: string | undefined = t(
                    'The add-on installation is in progress. It may take a few minutes to complete, the status of the Submariner add-on will be reported upon completion.'
                )
                if (connectionDegradedCondition) {
                    status = connectionDegradedCondition?.status === 'True' ? t('Degraded') : t('Healthy')
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
            header: t('Agent status'),
            cell: (mca: ManagedClusterAddOn) => {
                const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
                let type: StatusType = StatusType.progress
                let status: string = t('Progressing')
                let message: string | undefined = t(
                    'The add-on installation is in progress. It may take a few minutes to complete, the status of the Submariner add-on will be reported upon completion.'
                )
                if (agentCondition) {
                    status = agentCondition?.status === 'True' ? t('Degraded') : t('Healthy')
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
            header: t('Gateway nodes labeled'),
            cell: (mca: ManagedClusterAddOn) => {
                const nodeLabeledCondition = mca.status?.conditions?.find(
                    (c) => c.type === SubmarinerGatewayNodesLabeled
                )
                let type: StatusType = StatusType.progress
                let status: string = t('Progressing')
                let message: string | undefined = t(
                    'The add-on installation is in progress. It may take a few minutes to complete, the status of the Submariner add-on will be reported upon completion.'
                )
                if (nodeLabeledCondition) {
                    status =
                        nodeLabeledCondition?.status === 'True'
                            ? t('Nodes labeled')
                            : t('Nodes not labeled')
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
                        <AcmExpandableCard title={t('Multi-cluster networking')} id="submariner-info">
                            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('Submariner')}</Text>
                                        <Text component={TextVariants.p}>
                                            {t(
                                                'Submariner is an open-source tool that can be used to provide direct networking between two or more Kubernetes clusters in a given ManagedClusterSet, either on-premises or in the cloud.'
                                            )}
                                        </Text>
                                        <Text component={TextVariants.p}>
                                            <Trans
                                                i18nKey={
                                                    '<bold>Important: </bold>To get started with Submariner, your clusters must meet pre-requisite criteria and configurations before installing the Submariner add-on. Read the documentation for more information on how to use Submariner.'
                                                }
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
                                        {t('View documentation')}
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
                                                text: t('Uninstall add-on'),
                                                isDisabled: true,
                                                rbac: [rbacDelete(mca)],
                                                click: (mca: ManagedClusterAddOn) => {
                                                    setModalProps({
                                                        open: true,
                                                        title: t('Uninstall Submariner add-ons?'),
                                                        action: t('Uninstall'),
                                                        processing: t('Uninstalling'),
                                                        resources: [mca],
                                                        description: t(
                                                            'Uninstalling the Submariner add-on from a managed cluster will remove it from the multi-cluster network. This may result in disruption to your applications or services. Are you sure you want to continue?'
                                                        ),
                                                        columns,
                                                        icon: 'warning',
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
                                                text: t('Edit configuration'),
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
                            tableActions={[
                                {
                                    id: 'uninstall-submariner',
                                    title: t('Uninstall Submariner add-ons'),
                                    click: (mcas: ManagedClusterAddOn[]) => {
                                        setModalProps({
                                            open: true,
                                            title: t('Uninstall Submariner add-ons?'),
                                            action: t('Uninstall'),
                                            processing: t('Uninstalling'),
                                            resources: mcas,
                                            description: t(
                                                'Uninstalling the Submariner add-on from a managed cluster will remove it from the multi-cluster network. This may result in disruption to your applications or services. Are you sure you want to continue?'
                                            ),
                                            columns,
                                            icon: 'warning',
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
                                    variant: 'bulk-action',
                                },
                            ]}
                            rowActions={[]}
                            tableActionButtons={[
                                {
                                    id: 'install-submariner',
                                    title: t('Install Submariner add-ons'),
                                    click: () =>
                                        history.push(
                                            NavigationPath.clusterSetSubmarinerInstall.replace(
                                                ':id',
                                                clusterSet?.metadata.name!
                                            )
                                        ),
                                    variant: ButtonVariant.primary,
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={
                                        clusters!.length === 0
                                            ? t("You don't have any clusters assigned to this cluster set")
                                            : t('No Submariner add-ons found')
                                    }
                                    message={
                                        clusters!.length === 0 ? (
                                            <Trans
                                                i18nKey={
                                                    'At least two clusters must be assigned to the cluster set to create a multi-cluster network. Select the <bold>Manage resource assignments</bold> button to add clusters.'
                                                }
                                                components={{ bold: <strong />, p: <p /> }}
                                            />
                                        ) : (
                                            <Trans
                                                i18nKey={
                                                    'No clusters in this cluster set have the Submariner add-on installed. Select the <bold>Install Submariner add-ons</bold> button to install the add-on on any available clusters in this cluster set.'
                                                }
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
                                                {t('Manage resource assignments')}
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
                                                {t('Install Submariner add-ons')}
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
