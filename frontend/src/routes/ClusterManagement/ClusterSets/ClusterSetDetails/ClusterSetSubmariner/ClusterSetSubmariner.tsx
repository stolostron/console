/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import {
    PageSection,
    ModalVariant,
    SelectOption,
    ActionGroup,
    Stack,
    StackItem,
    Flex,
    FlexItem,
    TextContent,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import {
    AcmPageContent,
    AcmEmptyState,
    AcmTable,
    AcmModal,
    AcmForm,
    AcmAlertContext,
    AcmMultiSelect,
    AcmSubmit,
    AcmInlineStatus,
    StatusType,
    AcmExpandableCard,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ClusterSetContext } from '../ClusterSetDetails'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate } from '../../../../../lib/rbac-util'
import { ManagedClusterAddOn, ManagedClusterAddOnDefinition } from '../../../../../resources/managed-cluster-add-on'
import { NavigationPath } from '../../../../../NavigationPath'
import { ManagedClusterSetDefinition } from '../../../../../resources/managed-cluster-set'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { deleteResource, createResource, ResourceErrorCode, resultsSettled } from '../../../../../lib/resource-request'

type SubmarinerType = 'submariner'
const submariner: SubmarinerType = 'submariner'

type SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'
const SubmarinerGatewayNodesLabeled: SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'

type SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'
const SubmarinerAgentDegraded: SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'

type SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'
const SubmarinerConnectionDegraded: SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'

export const submarinerHealthCheck = (mca: ManagedClusterAddOn) => {
    const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
    const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
    const nodeLabeledCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerGatewayNodesLabeled)

    const isHealthyConnection = connectionDegradedCondition?.status === 'False'
    const isHealthyAgent = agentCondition?.status === 'False'
    const isNodeLabeled = nodeLabeledCondition?.status === 'True'

    // true = healthy, false = degraded
    return isHealthyConnection && isHealthyAgent && isNodeLabeled
}

export function ClusterSetSubmarinerPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const { clusterSet, clusters, submarinerAddons } = useContext(ClusterSetContext)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterAddOn> | { open: false }>({
        open: false,
    })
    const [installSubmarinerModalOpen, setInstallSubmarinerModalOpen] = useState<boolean>(false)

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
            header: t('table.submariner.connection'),
            cell: (mca: ManagedClusterAddOn) => {
                const connectionDegradedCondition = mca.status?.conditions?.find(
                    (c) => c.type === SubmarinerConnectionDegraded
                )
                let type: StatusType = StatusType.unknown
                let status: string = t('status.submariner.unknown')
                let message: undefined | string
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
                let type: StatusType = StatusType.unknown
                let status: string = t('status.submariner.unknown')
                let message: undefined | string
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
                let type: StatusType = StatusType.unknown
                let status: string = t('status.submariner.unknown')
                let message: undefined | string
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
                <BulkActionModel<ManagedClusterAddOn> {...modalProps} />
                <InstallSubmarinerModal
                    submarinerAddons={submarinerAddons!}
                    isOpen={installSubmarinerModalOpen}
                    onClose={() => setInstallSubmarinerModalOpen(false)}
                />
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
                            columns={columns}
                            keyFn={keyFn}
                            key="submarinerTable"
                            bulkActions={[
                                {
                                    id: 'uninstall-submariner',
                                    title: t('bulk.title.uninstallSubmariner'),
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
                                            actionFn: deleteResource,
                                            close: () => setModalProps({ open: false }),
                                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                        })
                                    },
                                },
                            ]}
                            rowActions={[
                                {
                                    id: 'uninstall-submariner',
                                    title: t('uninstall.add-on'),
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
                                            actionFn: deleteResource,
                                            close: () => setModalProps({ open: false }),
                                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                        })
                                    },
                                },
                            ]}
                            tableActions={[
                                {
                                    id: 'install-submariner',
                                    title: t('managed.clusterSets.submariner.addons.install'),
                                    click: () => setInstallSubmarinerModalOpen(true),
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
                                                id="install-submarienr"
                                                variant="primary"
                                                onClick={() => setInstallSubmarinerModalOpen(true)}
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

function InstallSubmarinerModal(props: {
    isOpen: boolean
    onClose: () => void
    submarinerAddons: ManagedClusterAddOn[]
}) {
    const { t } = useTranslation(['cluster'])
    const { clusters } = useContext(ClusterSetContext)
    const [selected, setSelected] = useState<string[] | undefined>(undefined)

    function reset() {
        props?.onClose()
        setSelected(undefined)
    }

    const availableClusters = clusters!.filter((cluster) => {
        return !props.submarinerAddons.find((addon) => addon.metadata.namespace === cluster.namespace)
    })

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t('managed.clusterSets.submariner.addons.install')}
            isOpen={props.isOpen}
            onClose={reset}
        >
            <AcmForm style={{ gap: 0 }}>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div style={{ marginBottom: '12px' }}>
                                {t('managed.clusterSets.submariner.addons.install.message')}
                            </div>
                            <AcmMultiSelect
                                id="select-clusters"
                                label={t('managed.clusterSets.submariner.addons.install.select')}
                                placeholder={t('managed.clusterSets.submariner.addons.install.placeholder')}
                                value={selected}
                                isRequired
                                onChange={(addons) => setSelected(addons)}
                            >
                                {availableClusters.map((cluster) => (
                                    <SelectOption key={cluster.name} value={cluster.name}>
                                        {cluster.name}
                                    </SelectOption>
                                ))}
                            </AcmMultiSelect>
                            <ActionGroup>
                                <AcmSubmit
                                    id="install"
                                    variant="primary"
                                    label={t('common:install')}
                                    processingLabel={t('common:installing')}
                                    onClick={async () => {
                                        alertContext.clearAlerts()
                                        return new Promise(async (resolve, reject) => {
                                            const requests = resultsSettled(
                                                selected!.map((cluster) => {
                                                    return createResource({
                                                        ...ManagedClusterAddOnDefinition,
                                                        metadata: {
                                                            name: submariner,
                                                            namespace: cluster,
                                                        },
                                                        spec: {
                                                            installNamespace: 'submariner-operator',
                                                        },
                                                    })
                                                })
                                            )
                                            const results = await requests.promise
                                            const errors: string[] = []
                                            results.forEach((res) => {
                                                if (res.status === 'rejected') {
                                                    errors.push(res.reason)
                                                }
                                            })

                                            if (errors.length > 0) {
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: t('common:request.failed'),
                                                    message: `${errors.map((error) => `${error} \n`)}`,
                                                })
                                                reject()
                                            } else {
                                                resolve()
                                                reset()
                                            }
                                        })
                                    }}
                                />
                                <AcmButton key="cancel" variant="link" onClick={reset}>
                                    {t('common:cancel')}
                                </AcmButton>
                            </ActionGroup>
                        </>
                    )}
                </AcmAlertContext.Consumer>
            </AcmForm>
        </AcmModal>
    )
}
