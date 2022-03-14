/* Copyright Contributors to the Open Cluster Management project */

import {
    Alert,
    Button,
    ButtonVariant,
    Checkbox,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Modal,
    ModalVariant,
    PageSection,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { AcmAlert, AcmTable, IAcmTableAction, IAcmTableColumn, ITableFilter } from '@stolostron/ui-components'
import moment from 'moment'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    channelsState,
    helmReleaseState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    policyAutomationState,
    policySetsState,
    subscriptionsState,
    usePolicies,
} from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { useTranslation } from '../../../lib/acm-i18next'
import { deletePolicy } from '../../../lib/delete-policy'
import { NavigationPath } from '../../../NavigationPath'
import { patchResource, Policy, PolicyApiVersion, PolicyAutomation, PolicyKind, PolicySet } from '../../../resources'
import { getSource, PolicySetList, resolveExternalStatus, resolveSource } from '../common/util'
import { ClusterPolicyViolationIcons2 } from '../components/ClusterPolicyViolations'
import { GovernanceCreatePolicyEmptyState } from '../components/GovernanceEmptyState'
import { PolicyActionDropdown } from '../components/PolicyActionDropdown'
import {
    PolicyClusterViolationSummaryMap,
    usePolicyClusterViolationSummaryMap,
} from '../overview/PolicyViolationSummary'

export interface PolicyTableItem {
    policy: Policy
    source: ReactNode | undefined
}

export default function PoliciesPage() {
    const { t } = useTranslation()
    const policies = usePolicies()
    const [helmReleases] = useRecoilState(helmReleaseState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [policyAutomations] = useRecoilState(policyAutomationState)

    // in a useEffect hook
    const tableItems: PolicyTableItem[] = policies.map((policy) => {
        const isExternal = resolveExternalStatus(policy)
        const policySource = resolveSource(policy, helmReleases, channels, subscriptions)
        let source: string | JSX.Element = 'Local'
        if (isExternal) {
            source = policySource ? getSource(policySource, isExternal, t) : 'Managed Externally'
        }
        return {
            policy,
            source,
        }
    })

    const policyClusterViolationSummaryMap = usePolicyClusterViolationSummaryMap(policies)
    const history = useHistory()
    const [policySets] = useRecoilState(policySetsState)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<PolicyTableItem> | { open: false }>({
        open: false,
    })
    const policyKeyFn = useCallback(
        (resource: PolicyTableItem) =>
            resource.policy.metadata.uid ?? `${resource.policy.metadata.name}/${resource.policy.metadata.namespace}`,
        []
    )
    const policyClusterViolationsColumn = usePolicyViolationsColumn(policyClusterViolationSummaryMap)
    const [modal, setModal] = useState<ReactNode | undefined>()

    const policyColumns = useMemo<IAcmTableColumn<PolicyTableItem>[]>(
        () => [
            {
                header: t('Name'),
                cell: (item: PolicyTableItem) => {
                    return (
                        <Link
                            to={{
                                pathname: NavigationPath.policyDetails
                                    .replace(':namespace', item.policy.metadata.namespace as string)
                                    .replace(':name', item.policy.metadata.name as string),
                                state: {
                                    from: NavigationPath.policies,
                                },
                            }}
                        >
                            {item.policy.metadata.name}
                        </Link>
                    )
                },
                sort: 'policy.metadata.name',
                search: 'policy.metadata.name',
            },
            {
                header: t('Namespace'),
                cell: 'policy.metadata.namespace',
                sort: 'policy.metadata.namespace',
                search: 'policy.metadata.namespace',
            },
            {
                header: t('Status'),
                cell: (item: PolicyTableItem) => (
                    <span>{item.policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>
                ),
            },
            {
                header: t('Remediation'),
                cell: 'policy.spec.remediationAction',
                sort: 'policy.spec.remediationAction',
            },
            {
                header: t('Policy set'),
                cell: (item: PolicyTableItem) => {
                    const policySetsMatch = policySets.filter((policySet: PolicySet) =>
                        policySet.spec.policies.includes(item.policy.metadata.name!)
                    )
                    if (policySetsMatch.length > 0) {
                        return <PolicySetList policySets={policySetsMatch} />
                    }
                    return '-'
                },
            },
            policyClusterViolationsColumn,
            {
                header: t('Source'),
                cell: (item: PolicyTableItem) => {
                    return item.source ? item.source : '-'
                },
            },
            {
                header: t('Automation'),
                cell: (item: PolicyTableItem) => {
                    const policyAutomationMatch = policyAutomations.find(
                        (pa: PolicyAutomation) => pa.spec.policyRef === item.policy.metadata.name
                    )
                    if (policyAutomationMatch) {
                        return (
                            <Link
                                to={{
                                    pathname: NavigationPath.editPolicyAutomation
                                        .replace(':namespace', item.policy.metadata.namespace as string)
                                        .replace(':name', item.policy.metadata.name as string),
                                    state: {
                                        from: NavigationPath.policies,
                                    },
                                }}
                            >
                                {policyAutomationMatch.metadata.name}
                            </Link>
                        )
                    } else {
                        return (
                            <Link
                                to={{
                                    pathname: NavigationPath.createPolicyAutomation
                                        .replace(':namespace', item.policy.metadata.namespace as string)
                                        .replace(':name', item.policy.metadata.name as string),
                                    state: {
                                        from: NavigationPath.policies,
                                    },
                                }}
                            >
                                {t('Configure')}
                            </Link>
                        )
                    }
                },
            },
            {
                header: t('Created'),
                cell: (item: PolicyTableItem) => {
                    if (item.policy.metadata?.creationTimestamp) {
                        return <span>{moment(new Date(item.policy.metadata?.creationTimestamp)).fromNow()}</span>
                    }
                    return '-'
                },
                sort: 'policy.metadata.creationTimestamp',
            },
            {
                header: '',
                cell: (item: PolicyTableItem) => {
                    return <PolicyActionDropdown setModal={setModal} item={item} isKebab={true} />
                },
                cellTransforms: [fitContent],
            },
        ],
        [policyClusterViolationsColumn, policySets, policyAutomations, t]
    )

    const bulkModalStatusColumns = useMemo(
        () => [
            {
                header: t('policy.tableHeader.name'),
                cell: 'policy.metadata.name',
                sort: 'policy.metadata.name',
            },
            {
                header: t('policy.table.actionGroup.status'),
                cell: (item: PolicyTableItem) => (
                    <span>
                        {item.policy.spec.disabled === true
                            ? t('policy.table.actionGroup.status.disabled')
                            : t('policy.table.actionGroup.status.enabled')}
                    </span>
                ),
            },
        ],
        [t]
    )

    const bulkModalRemediationColumns = useMemo(
        () => [
            {
                header: t('policy.tableHeader.name'),
                cell: 'policy.metadata.name',
                sort: 'policy.metadata.name',
            },
            {
                header: t('policy.table.actionGroup.status'),
                cell: (item: PolicyTableItem) => (
                    <span>
                        {item.policy.spec.remediationAction === t('policy.table.actions.inform').toLowerCase()
                            ? t('policy.table.actions.inform')
                            : t('policy.table.actions.enforce')}
                    </span>
                ),
            },
        ],
        [t]
    )

    const tableActions = useMemo<IAcmTableAction<PolicyTableItem>[]>(
        () => [
            {
                variant: 'bulk-action',
                id: 'add-to-set',
                title: t('policy.table.actions.addToPolicySet'),
                click: () => {},
            },
            {
                id: 'seperator-1',
                variant: 'action-seperator',
            },
            {
                variant: 'action-group',
                id: 'status',
                title: t('policy.table.actionGroup.status'),
                actions: [
                    {
                        variant: 'bulk-action',
                        id: 'enable',
                        title: t('policy.table.actions.enable'),
                        click: (item) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.enable'),
                                action: t('policy.table.actions.enable'),
                                processing: t('policy.table.actions.enabling'),
                                resources: [...item],
                                description: t('policy.modal.message.enable'),
                                columns: bulkModalStatusColumns,
                                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                                actionFn: (item) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: item.policy.metadata.name,
                                                namespace: item.policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/disabled', value: false }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                hasExternalResources:
                                    [...item].filter((item) => {
                                        return item.source !== 'Local'
                                    }).length > 0,
                            })
                        },
                    },
                    {
                        variant: 'bulk-action',
                        id: 'disable',
                        title: t('policy.table.actions.disable'),
                        click: (item) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.disable'),
                                action: t('policy.table.actions.disable'),
                                processing: t('policy.table.actions.disabling'),
                                resources: [...item],
                                description: t('policy.modal.message.disable'),
                                columns: bulkModalStatusColumns,
                                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                                actionFn: (item) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: item.policy.metadata.name,
                                                namespace: item.policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/disabled', value: true }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                hasExternalResources:
                                    [...item].filter((item) => {
                                        return item.source !== 'Local'
                                    }).length > 0,
                            })
                        },
                    },
                ],
            },
            {
                id: 'seperator-2',
                variant: 'action-seperator',
            },
            {
                variant: 'action-group',
                id: 'remediation',
                title: t('policy.table.actionGroup.remediation'),
                actions: [
                    {
                        variant: 'bulk-action',
                        id: 'inform',
                        title: t('policy.table.actions.inform'),
                        click: (item) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.inform'),
                                action: t('policy.table.actions.inform'),
                                processing: t('policy.table.actions.informing'),
                                resources: [...item],
                                description: t('policy.modal.message.inform'),
                                columns: bulkModalRemediationColumns,
                                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                                actionFn: (item) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: item.policy.metadata.name,
                                                namespace: item.policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/remediationAction', value: 'inform' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                hasExternalResources:
                                    [...item].filter((item) => {
                                        return item.source !== 'Local'
                                    }).length > 0,
                            })
                        },
                    },
                    {
                        variant: 'bulk-action',
                        id: 'enforce',
                        title: t('policy.table.actions.enforce'),
                        click: (item) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.enforce'),
                                action: t('policy.table.actions.enforce'),
                                processing: t('policy.table.actions.enforcing'),
                                resources: [...item],
                                description: t('policy.modal.message.enforce'),
                                columns: bulkModalRemediationColumns,
                                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                                actionFn: (item) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: item.policy.metadata.name,
                                                namespace: item.policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/remediationAction', value: 'enforce' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                hasExternalResources:
                                    [...item].filter((item) => {
                                        return item.source !== 'Local'
                                    }).length > 0,
                            })
                        },
                    },
                ],
            },
        ],
        [t, bulkModalStatusColumns, bulkModalRemediationColumns]
    )

    const [namespaces] = useRecoilState(namespacesState)

    const filters = useMemo<ITableFilter<PolicyTableItem>[]>(
        () => [
            {
                id: 'violations',
                label: 'Cluster violations',
                options: [
                    {
                        label: 'Without violations',
                        value: 'Without violations',
                    },
                    {
                        label: 'With violations',
                        value: 'With violations',
                    },
                ],
                tableFilterFn: (selectedValues, item) => {
                    if (selectedValues.includes('With violations')) {
                        if (item.policy.status?.compliant === 'NonCompliant') return true
                    }
                    if (selectedValues.includes('Without violations')) {
                        if (item.policy.status?.compliant === 'Compliant') return true
                    }
                    return false
                },
            },
            {
                id: 'namespace',
                label: 'Namespace',
                options: namespaces.map((namespace) => ({
                    label: namespace.metadata.name,
                    value: namespace.metadata.name ?? '',
                })),
                tableFilterFn: (selectedValues, item) => {
                    return selectedValues.includes(item.policy.metadata.namespace ?? '')
                },
            },
            {
                id: 'remediation',
                label: 'Remediation',
                options: [
                    { label: 'Inform', value: 'inform' },
                    { label: 'Enforce', value: 'enforce' },
                ],
                tableFilterFn: (selectedValues, item) => {
                    return selectedValues.includes(item.policy.spec.remediationAction)
                },
            },
            {
                id: 'enabled',
                label: 'Enabled',
                options: [
                    {
                        label: 'True',
                        value: 'True',
                    },
                    {
                        label: 'False',
                        value: 'False',
                    },
                ],
                tableFilterFn: (selectedValues, item) => {
                    if (selectedValues.includes('True')) {
                        if (!item.policy.spec.disabled) return true
                    }
                    if (selectedValues.includes('False')) {
                        if (item.policy.spec.disabled) return true
                    }
                    return false
                },
            },
        ],
        [namespaces]
    )

    if (tableItems.length === 0) {
        return <GovernanceCreatePolicyEmptyState />
    }

    return (
        <PageSection isWidthLimited>
            {modal !== undefined && modal}
            <BulkActionModel<PolicyTableItem> {...modalProps} />
            <AcmTable<PolicyTableItem>
                plural={t('Policies')}
                columns={policyColumns}
                keyFn={policyKeyFn}
                items={tableItems}
                tableActions={tableActions}
                gridBreakPoint={TableGridBreakpoint.none}
                filters={filters}
                tableActionButtons={[
                    {
                        variant: ButtonVariant.primary,
                        id: 'create',
                        title: 'Create policy',
                        click: () => history.push(NavigationPath.createPolicy),
                    },
                ]}
                addSubRows={(item: PolicyTableItem) => {
                    const standards = item.policy.metadata.annotations?.['policy.open-cluster-management.io/standards']
                    const controls = item.policy.metadata.annotations?.['policy.open-cluster-management.io/controls']
                    const categories =
                        item.policy.metadata.annotations?.['policy.open-cluster-management.io/categories']
                    if (!standards && !controls && !categories) return undefined
                    return [
                        {
                            fullWidth: true,
                            cells: [
                                {
                                    title: (
                                        <div style={{ marginLeft: 106, marginTop: '20px', marginBottom: '20px' }}>
                                            <DescriptionList isAutoFit isAutoColumnWidths>
                                                <DescriptionListGroup>
                                                    <DescriptionListTerm>{'Standards'}</DescriptionListTerm>
                                                    <DescriptionListDescription>
                                                        {standards ?? '-'}
                                                    </DescriptionListDescription>
                                                </DescriptionListGroup>
                                                <DescriptionListGroup>
                                                    <DescriptionListTerm>{'Controls'}</DescriptionListTerm>
                                                    <DescriptionListDescription>
                                                        {controls ?? '-'}
                                                    </DescriptionListDescription>
                                                </DescriptionListGroup>
                                                <DescriptionListGroup>
                                                    <DescriptionListTerm>{'Categories'}</DescriptionListTerm>
                                                    <DescriptionListDescription>
                                                        {categories ?? '-'}
                                                    </DescriptionListDescription>
                                                </DescriptionListGroup>
                                            </DescriptionList>
                                        </div>
                                    ),
                                },
                            ],
                        },
                    ]
                }}
            />
        </PageSection>
    )
}

function usePolicyViolationsColumn(
    policyClusterViolationSummaryMap: PolicyClusterViolationSummaryMap
): IAcmTableColumn<PolicyTableItem> {
    const { t } = useTranslation()
    return {
        header: t('Cluster violations'),
        cell: (item) => {
            const clusterViolationSummary = policyClusterViolationSummaryMap[item.policy.metadata.uid ?? '']
            if (
                clusterViolationSummary.compliant ||
                clusterViolationSummary.noncompliant ||
                clusterViolationSummary.unknown
            ) {
                // TODO - add url search params when ready to soort/filter by violation type
                return (
                    <ClusterPolicyViolationIcons2
                        compliant={clusterViolationSummary.compliant}
                        compliantHref={`${NavigationPath.policyDetailsResults
                            .replace(':namespace', item.policy.metadata?.namespace ?? '')
                            .replace(':name', item.policy.metadata?.name ?? '')}`}
                        noncompliant={clusterViolationSummary.noncompliant}
                        violationHref={`${NavigationPath.policyDetailsResults
                            .replace(':namespace', item.policy.metadata?.namespace ?? '')
                            .replace(':name', item.policy.metadata?.name ?? '')}`}
                    />
                )
            } else {
                return '-'
            }
        },
        sort: (lhs, rhs) => {
            const lhsViolations = policyClusterViolationSummaryMap[lhs.policy.metadata.uid ?? '']
            const rhsViolations = policyClusterViolationSummaryMap[rhs.policy.metadata.uid ?? '']
            if (lhsViolations === rhsViolations) return 0
            if (!lhsViolations) return -1
            if (!rhsViolations) return 1
            if (lhsViolations.noncompliant > rhsViolations.noncompliant) return -1
            if (lhsViolations.noncompliant < rhsViolations.noncompliant) return 1
            if (lhsViolations.compliant > rhsViolations.compliant) return -1
            if (lhsViolations.compliant < rhsViolations.compliant) return 1
            return 0
        },
    }
}

export function DeletePolicyModal(props: { item: PolicyTableItem; onClose: () => void }) {
    const { t } = useTranslation()
    const [deletePlacements, setDeletePlacements] = useState(true)
    const [deletePlacementBindings, setDeletePlacementBindings] = useState(true)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const onConfirm = useCallback(async () => {
        setIsDeleting(true)
        try {
            setError('')
            await deletePolicy(
                props.item.policy,
                placements,
                placementRules,
                placementBindings,
                deletePlacements,
                deletePlacementBindings
            ).promise
            props.onClose()
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError(t('Unknown error occured'))
            }
            setIsDeleting(false)
        }
    }, [props, placements, placementRules, placementBindings, deletePlacements, deletePlacementBindings, t])
    return (
        <Modal
            title={t('policy.modal.title.delete')}
            titleIconVariant={'danger'}
            isOpen
            onClose={props.onClose}
            actions={[
                <Button key="confirm" variant="primary" onClick={onConfirm} isLoading={isDeleting}>
                    {isDeleting ? t('deleting') : t('delete')}
                </Button>,
                <Button key="cancel" variant="link" onClick={props.onClose}>
                    {t('Cancel')}
                </Button>,
            ]}
            variant={ModalVariant.small}
        >
            <Stack hasGutter>
                <StackItem>
                    {t(`Removing ${props.item.policy.metadata.name} is irreversible. Select any associated resources that need to be
            deleted in addition to ${props.item.policy.metadata.name}.`)}
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placement-bindings"
                        isChecked={deletePlacementBindings}
                        onChange={setDeletePlacementBindings}
                        label={t('policy.modal.delete.associatedResources.placementBinding')}
                    />
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placements"
                        isChecked={deletePlacements}
                        onChange={setDeletePlacements}
                        label={t('policy.modal.delete.associatedResources.placementRule')}
                    />
                </StackItem>
                {props.item.source !== 'Local' ? (
                    <StackItem>
                        <AcmAlert
                            variant="info"
                            title={t('Some selected resources are managed externally')}
                            message={t(
                                'Any changes made here may be overridden by the content of an upstream repository.'
                            )}
                            isInline
                        />
                    </StackItem>
                ) : null}
                {error && (
                    <StackItem>
                        <Alert variant="danger" title={error} isInline />
                    </StackItem>
                )}
            </Stack>
        </Modal>
    )
}
