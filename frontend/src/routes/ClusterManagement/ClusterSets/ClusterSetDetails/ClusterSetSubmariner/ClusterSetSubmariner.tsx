/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState, useEffect } from 'react'
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
    List,
    ListItem,
} from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
    AcmPageContent,
    AcmEmptyState,
    AcmTable,
    AcmModal,
    AcmForm,
    AcmAlertContext,
    AcmSubmit,
    AcmInlineStatus,
    StatusType,
    AcmExpandableCard,
    AcmButton,
    Provider,
    AcmAlertGroup,
    AcmMultiSelect,
    AcmExpandableSection,
    AcmAlert,
} from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ClusterSetContext } from '../ClusterSetDetails'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate } from '../../../../../lib/rbac-util'
import { Cluster } from '../../../../../lib/get-cluster'
import { Secret, listNamespaceSecrets } from '../../../../../resources/secret'
import {
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    SubmarinerConfigKind,
} from '../../../../../resources/submariner-config'
import {
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
} from '../../../../../resources/managed-cluster-add-on'
import { NavigationPath } from '../../../../../NavigationPath'
import { submarinerConfigsState } from '../../../../../atoms'
import { ManagedClusterSetDefinition } from '../../../../../resources/managed-cluster-set'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { deleteSubmarinerAddon } from '../../../../../lib/delete-submariner'
import { ResourceErrorCode, createResource, resultsSettled } from '../../../../../lib/resource-request'
import { rbacDelete } from '../../../../../lib/rbac-util'
import { RbacDropdown } from '../../../../../components/Rbac'

type SubmarinerType = 'submariner'
const submariner: SubmarinerType = 'submariner'

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
    const [submarinerConfigs] = useRecoilState(submarinerConfigsState)
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
                            columns={[
                                ...columns,
                                {
                                    header: '',
                                    cellTransforms: [fitContent],
                                    cell: (mca: ManagedClusterAddOn) => {
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
                                                id="install-submariner"
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

// supported providers for creating a SubmarinerConfig resource
const submarinerConfigProviders = [Provider.aws, Provider.gcp, Provider.vmware]

// used to try to auto-detect the provider secret in the cluster namespace
const providerAutoDetectSecret: Record<string, (secrets: Secret[]) => Secret | undefined> = {
    [Provider.aws]: (secrets: Secret[]) => secrets.find((s) => s.data?.['aws_access_key_id']),
    [Provider.gcp]: (secrets: Secret[]) => secrets.find((s) => s.data?.['osServiceAccount.json']),
    [Provider.azure]: (secrets: Secret[]) => secrets.find((s) => s.data?.['osServicePrincipal.json']),
    [Provider.vmware]: (secrets: Secret[]) =>
        secrets.find(
            (s) =>
                s.data?.['username'] &&
                s.data?.['password'] &&
                s.metadata.labels?.['hive.openshift.io/secret-type'] !== 'kubeadmincreds'
        ),
    [Provider.openstack]: (secrets: Secret[]) => secrets.find((s) => s.data?.['clouds.yaml']),
}

function InstallSubmarinerModal(props: {
    isOpen: boolean
    onClose: () => void
    submarinerAddons: ManagedClusterAddOn[]
}) {
    const { t } = useTranslation(['cluster', 'common'])
    const { clusters } = useContext(ClusterSetContext)
    const [selectedClusters, setSelectedClusters] = useState<string[] | undefined>(undefined)
    const [providerSecretMap, setProviderSecretMap] = useState<Record<string, string | null>>({})
    const [withoutSubmarinerConfigClusters, setWithoutSubmarinerConfigClusters] = useState<Cluster[]>([])
    const [fetchSecrets, setFetchSecrets] = useState<boolean>(true)

    const availableClusters = clusters!.filter(
        (cluster) => !props.submarinerAddons.find((addon) => addon.metadata.namespace === cluster.namespace)
    )

    useEffect(() => {
        if (fetchSecrets) {
            setFetchSecrets(false)
            const calls = resultsSettled(
                availableClusters
                    .filter((c) => submarinerConfigProviders.includes(c!.provider!))
                    .map((c) => listNamespaceSecrets(c.namespace!))
            )
            const map: Record<string, string | null> = {}
            calls.promise
                .then((results) => {
                    results.forEach((res) => {
                        if (res.status === 'fulfilled') {
                            const secrets: Secret[] = res.value
                            const matchedCluster: Cluster | undefined = availableClusters.find(
                                (c) => c.namespace === secrets?.[0]?.metadata.namespace
                            )
                            if (matchedCluster) {
                                const providerSecret = providerAutoDetectSecret[matchedCluster!.provider!](secrets)
                                map[matchedCluster.namespace!] = providerSecret?.metadata.name ?? null // null means secret not found
                            }
                        }
                    })
                })
                .finally(() => setProviderSecretMap(map))
        }
    }, [availableClusters, providerSecretMap, fetchSecrets])

    function reset() {
        props?.onClose()
        setSelectedClusters(undefined)
        setWithoutSubmarinerConfigClusters([])
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t('managed.clusterSets.submariner.addons.install')}
            isOpen={props.isOpen}
            onClose={reset}
        >
            <AcmForm>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div style={{ marginBottom: '12px' }}>
                                {t('managed.clusterSets.submariner.addons.install.message')}
                            </div>

                            {withoutSubmarinerConfigClusters.length > 0 && (
                                <AcmAlert
                                    variant="info"
                                    isInline
                                    noClose
                                    title={t('common:important')}
                                    message={
                                        <>
                                            <Trans
                                                i18nKey="cluster:managed.clusterSets.submariner.addons.config.notSupported"
                                                components={{
                                                    bold: <strong />,
                                                    button: (
                                                        <AcmButton
                                                            onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                                                            variant="link"
                                                            role="link"
                                                            isInline
                                                            icon={<ExternalLinkAltIcon />}
                                                            iconPosition="right"
                                                        />
                                                    ),
                                                }}
                                            />
                                            <AcmExpandableSection
                                                label={t(
                                                    'managed.clusterSets.submariner.addons.config.notSupported.view',
                                                    {
                                                        number: withoutSubmarinerConfigClusters.length,
                                                    }
                                                )}
                                            >
                                                <List>
                                                    {withoutSubmarinerConfigClusters.map((cluster) => {
                                                        const isUnsupportedProvider =
                                                            !submarinerConfigProviders.includes(cluster!.provider!)
                                                        return (
                                                            <ListItem>
                                                                {t(
                                                                    isUnsupportedProvider
                                                                        ? 'managed.clusterSets.submariner.addons.config.notSupported.provider'
                                                                        : 'managed.clusterSets.submariner.addons.config.notSupported.secret',
                                                                    { clusterName: cluster.name! }
                                                                )}
                                                            </ListItem>
                                                        )
                                                    })}
                                                </List>
                                            </AcmExpandableSection>
                                        </>
                                    }
                                />
                            )}

                            <AcmMultiSelect
                                id="select-clusters"
                                label={t('managed.clusterSets.submariner.addons.install.select')}
                                placeholder={t('managed.clusterSets.submariner.addons.install.placeholder')}
                                value={selectedClusters}
                                isRequired
                                onChange={(clusters) => {
                                    setSelectedClusters(clusters)

                                    const withoutSubmarinerConfigList = clusters
                                        ?.filter((cluster: string) => {
                                            const matchedCluster: Cluster = availableClusters.find(
                                                (c) => c.name === cluster
                                            )!
                                            return (
                                                providerSecretMap[cluster] === null ||
                                                !submarinerConfigProviders.includes(matchedCluster!.provider!)
                                            )
                                        })
                                        .map((name) => availableClusters.find((c) => c.name === name)!)

                                    setWithoutSubmarinerConfigClusters(withoutSubmarinerConfigList ?? [])
                                }}
                            >
                                {availableClusters.map((cluster) => (
                                    <SelectOption key={cluster.name} value={cluster!.name!}>
                                        {cluster.name}
                                    </SelectOption>
                                ))}
                            </AcmMultiSelect>

                            <AcmAlertGroup isInline canClose />
                            <ActionGroup>
                                <AcmSubmit
                                    id="install"
                                    variant="primary"
                                    label={t('common:install')}
                                    processingLabel={t('common:installing')}
                                    onClick={async () => {
                                        alertContext.clearAlerts()
                                        return new Promise(async (resolve, reject) => {
                                            const calls: any[] = []
                                            selectedClusters?.forEach((selected) => {
                                                const cluster: Cluster = availableClusters.find(
                                                    (c) => c.name === selected
                                                )!
                                                calls.push(
                                                    createResource<ManagedClusterAddOn>({
                                                        apiVersion: ManagedClusterAddOnApiVersion,
                                                        kind: ManagedClusterAddOnKind,
                                                        metadata: {
                                                            name: submariner,
                                                            namespace: cluster?.namespace!,
                                                        },
                                                        spec: {
                                                            installNamespace: 'submariner-operator',
                                                        },
                                                    })
                                                )
                                                if (providerSecretMap[cluster.name!]) {
                                                    calls.push(
                                                        createResource<SubmarinerConfig>({
                                                            apiVersion: SubmarinerConfigApiVersion,
                                                            kind: SubmarinerConfigKind,
                                                            metadata: {
                                                                name: 'subconfig',
                                                                namespace: cluster?.namespace!,
                                                            },
                                                            spec: {
                                                                credentialsSecret: {
                                                                    name: providerSecretMap[cluster.name!]!,
                                                                },
                                                            },
                                                        })
                                                    )
                                                }
                                            })

                                            const requests = resultsSettled(calls)
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
                                                resolve(results)
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
