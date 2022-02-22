/* Copyright Contributors to the Open Cluster Management project */

import {
    ButtonVariant,
    Checkbox,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    PageSection,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { AcmTable, IAcmTableAction, IAcmTableColumn, ITableFilter } from '@stolostron/ui-components'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { namespacesState, policiesState, policySetsState } from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { useTranslation } from '../../../lib/acm-i18next'
import { deletePolicy } from '../../../lib/delete-policy'
import { NavigationPath } from '../../../NavigationPath'
import { patchResource, Policy, PolicyApiVersion, PolicyKind, PolicySet, ResourceErrorCode } from '../../../resources'
import { PolicySetList } from '../common/util'
import { ClusterPolicyViolationIcons2 } from '../components/ClusterPolicyViolations'
import { GovernanceCreatePolicyEmptyState } from '../components/GovernanceEmptyState'
import {
    PolicyClusterViolationSummaryMap,
    usePolicyClusterViolationSummaryMap,
} from '../overview/PolicyViolationSummary'

export default function PoliciesPage() {
    const [policiesSource] = useRecoilState(policiesState)
    const policies = useMemo(
        () =>
            policiesSource.filter(
                (policy) => policy.metadata.labels?.['policy.open-cluster-management.io/root-policy'] === undefined
            ),
        [policiesSource]
    )
    const policyClusterViolationSummaryMap = usePolicyClusterViolationSummaryMap(policies)
    const history = useHistory()
    const { t } = useTranslation()
    const [policySets] = useRecoilState(policySetsState)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Policy> | { open: false }>({
        open: false,
    })
    const [placementBindingChecked] = useState(false)
    const [placementRuleChecked] = useState(false)
    const policyKeyFn = useCallback(
        (resource: Policy) => resource.metadata.uid ?? `${resource.metadata.name}/${resource.metadata.namespace}`,
        []
    )
    const policyClusterViolationsColumn = usePolicyViolationsColumn(policyClusterViolationSummaryMap)
    const policyColumns = useMemo<IAcmTableColumn<Policy>[]>(
        () => [
            {
                header: t('Name'),
                cell: (policy) => {
                    return (
                        <Link
                            to={{
                                pathname: NavigationPath.policyDetails
                                    .replace(':namespace', policy.metadata.namespace as string)
                                    .replace(':name', policy.metadata.name as string),
                                state: {
                                    from: NavigationPath.policies,
                                },
                            }}
                        >
                            {policy.metadata.name}
                        </Link>
                    )
                },
                sort: 'metadata.name',
                search: 'metadata.name',
            },
            {
                header: t('Namespace'),
                cell: 'metadata.namespace',
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
            },
            {
                header: t('Status'),
                cell: (policy: Policy) => <span>{policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>,
            },
            {
                header: t('Remediation'),
                cell: 'spec.remediationAction',
                sort: 'spec.remediationAction',
            },
            {
                header: t('Policy set'),
                cell: (policy: Policy) => {
                    const policySetsMatch = policySets.filter((policySet: PolicySet) =>
                        policySet.spec.policies.includes(policy.metadata.name!)
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
                cell: () => {
                    return '-'
                },
            },
            {
                header: t('Automation'),
                cell: () => '-',
            },
        ],
        [policyClusterViolationsColumn]
    )

    let pbcheck = false
    let prcheck = false

    const renderRelatedResourceCheckbox = (placementBindingChecked: boolean, placementRuleChecked: boolean) => {
        const handlePlacementBindingChecked = () => {
            return (pbcheck = !placementBindingChecked)
        }
        const handlePlacementRuleChecked = () => {
            return (prcheck = !placementRuleChecked)
        }
        return (
            <Fragment>
                <Checkbox
                    id={'remove-placementBinding'}
                    isChecked={placementBindingChecked}
                    onClick={() => handlePlacementBindingChecked()}
                    label={t('policy.modal.delete.associatedResources.placementBinding')}
                />
                <Checkbox
                    id={'remove-placementRule'}
                    isChecked={placementRuleChecked}
                    onClick={() => handlePlacementRuleChecked()}
                    label={t('policy.modal.delete.associatedResources.placementRule')}
                />
            </Fragment>
        )
    }

    const bulkModalStatusColumns = [
        {
            header: t('policy.tableHeader.name'),
            cell: 'metadata.name',
            sort: 'metadata.name',
        },
        {
            header: t('policy.table.actionGroup.status'),
            cell: (policy: Policy) => (
                <span>
                    {policy.spec.disabled === true
                        ? t('policy.table.actionGroup.status.disabled')
                        : t('policy.table.actionGroup.status.enabled')}
                </span>
            ),
        },
    ]

    const bulkModalRemediationColumns = [
        {
            header: t('policy.tableHeader.name'),
            cell: 'metadata.name',
            sort: 'metadata.name',
        },
        {
            header: t('policy.table.actionGroup.status'),
            cell: (policy: Policy) => (
                <span>
                    {policy.spec.remediationAction === t('policy.table.actions.inform').toLowerCase()
                        ? t('policy.table.actions.inform')
                        : t('policy.table.actions.enforce')}
                </span>
            ),
        },
    ]

    const tableActions = useMemo<IAcmTableAction<Policy>[]>(
        () => [
            // TODO: Revisit bulk deletion
            /*{
                variant: 'bulk-action',
                id: 'delete-policy',
                title: t('Delete'),
                click: (policies: Policy[]) => {
                    setModalProps({
                        open: true,
                        title: t('policy.bulk.title.delete'),
                        action: t('delete'),
                        processing: t('deleting'),
                        resources: [...policies],
                        description: t('bulk.message.delete.grc'),
                        columns: [
                            {
                                header: t('policy.tableHeader.name'),
                                cell: 'metadata.name',
                                sort: 'metadata.name',
                            },
                        ],
                        keyFn: (policy: Policy) => policy.metadata.uid as string,
                        actionFn: (policy) => deletePolicy(policy, pbcheck, prcheck),
                        close: () => {
                            setModalProps({ open: false })
                            pbcheck = false
                            prcheck = false
                        },
                        checkBox: renderRelatedResourceCheckbox(placementRuleChecked, placementBindingChecked),
                        isDanger: true,
                        icon: 'warning',
                        confirmText: 'confirm',
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
            }, */
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
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.enable'),
                                action: t('policy.table.actions.enable'),
                                processing: t('policy.table.actions.enabling'),
                                resources: [...policies],
                                description: t('policy.modal.message.enable'),
                                columns: bulkModalStatusColumns,
                                keyFn: (policy: Policy) => policy.metadata.uid as string,
                                actionFn: (policy) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: policy.metadata.name,
                                                namespace: policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/disabled', value: false }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                            })
                        },
                    },
                    {
                        variant: 'bulk-action',
                        id: 'disable',
                        title: t('policy.table.actions.disable'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.disable'),
                                action: t('policy.table.actions.disable'),
                                processing: t('policy.table.actions.disabling'),
                                resources: [...policies],
                                description: t('policy.modal.message.disable'),
                                columns: [
                                    {
                                        header: t('policy.tableHeader.name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('policy.table.actionGroup.status'),
                                        cell: (policy) => (
                                            <span>
                                                {policy.spec.disabled === true
                                                    ? t('policy.table.actionGroup.status.disabled')
                                                    : t('policy.table.actionGroup.status.enabled')}
                                            </span>
                                        ),
                                    },
                                ],
                                keyFn: (policy: Policy) => policy.metadata.uid as string,
                                actionFn: (policy) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: policy.metadata.name,
                                                namespace: policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/disabled', value: true }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
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
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.inform'),
                                action: t('policy.table.actions.inform'),
                                processing: t('policy.table.actions.informing'),
                                resources: [...policies],
                                description: t('policy.modal.message.inform'),
                                columns: bulkModalRemediationColumns,
                                keyFn: (policy: Policy) => policy.metadata.uid as string,
                                actionFn: (policy) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: policy.metadata.name,
                                                namespace: policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/remediationAction', value: 'inform' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                            })
                        },
                    },
                    {
                        variant: 'bulk-action',
                        id: 'enforce',
                        title: t('policy.table.actions.enforce'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('policy.modal.title.enforce'),
                                action: t('policy.table.actions.enforce'),
                                processing: t('policy.table.actions.enforcing'),
                                resources: [...policies],
                                description: t('policy.modal.message.enforce'),
                                columns: bulkModalRemediationColumns,
                                keyFn: (policy: Policy) => policy.metadata.uid as string,
                                actionFn: (policy) => {
                                    return patchResource(
                                        {
                                            apiVersion: PolicyApiVersion,
                                            kind: PolicyKind,
                                            metadata: {
                                                name: policy.metadata.name,
                                                namespace: policy.metadata.namespace,
                                            },
                                        } as Policy,
                                        [{ op: 'replace', path: '/spec/remediationAction', value: 'enforce' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                            })
                        },
                    },
                ],
            },
        ],
        [placementRuleChecked, placementBindingChecked]
    )

    const rowActionResolver = useCallback(
        (policy: Policy) => {
            const policyRowActions = [
                {
                    id: 'enable-policy',
                    title: t('Enable'),
                    tooltip: policy.spec.disabled ? 'Enable policy' : 'Policy is already enabled',
                    isDisabled: policy.spec.disabled === false,
                    click: (policy: Policy) => {
                        setModalProps({
                            open: true,
                            title: t('policy.modal.title.enable'),
                            action: t('policy.table.actions.enable'),
                            processing: t('policy.table.actions.enabling'),
                            resources: [policy],
                            description: t('policy.modal.message.enable'),
                            keyFn: (policy: Policy) => policy.metadata.uid as string,
                            actionFn: (policy) => {
                                return patchResource(
                                    {
                                        apiVersion: PolicyApiVersion,
                                        kind: PolicyKind,
                                        metadata: {
                                            name: policy.metadata.name,
                                            namespace: policy.metadata.namespace,
                                        },
                                    } as Policy,
                                    [{ op: 'replace', path: '/spec/disabled', value: false }]
                                )
                            },
                            close: () => {
                                setModalProps({ open: false })
                            },
                        })
                    },
                },
                {
                    id: 'disable-policy',
                    title: t('policy.table.actions.disable'),
                    tooltip: policy.spec.disabled ? 'Policy is already disabled' : 'Disable policy',
                    isDisabled: policy.spec.disabled === true,
                    click: (policy: Policy) => {
                        setModalProps({
                            open: true,
                            title: t('policy.modal.title.disable'),
                            action: t('policy.table.actions.disable'),
                            processing: t('policy.table.actions.disabling'),
                            resources: [policy],
                            description: t('policy.modal.message.disable'),
                            keyFn: (policy: Policy) => policy.metadata.uid as string,
                            actionFn: (policy) => {
                                return patchResource(
                                    {
                                        apiVersion: PolicyApiVersion,
                                        kind: PolicyKind,
                                        metadata: {
                                            name: policy.metadata.name,
                                            namespace: policy.metadata.namespace,
                                        },
                                    } as Policy,
                                    [{ op: 'replace', path: '/spec/disabled', value: true }]
                                )
                            },
                            close: () => {
                                setModalProps({ open: false })
                            },
                        })
                    },
                },
                {
                    id: 'inform-policy',
                    title: t('policy.table.actions.inform'),
                    tooltip: policy.spec.remediationAction === 'inform' ? 'Already informing' : 'Inform policy',
                    addSeparator: true,
                    isDisabled: policy.spec.remediationAction === 'inform',
                    click: (policy: Policy) => {
                        setModalProps({
                            open: true,
                            title: t('policy.modal.title.inform'),
                            action: t('policy.table.actions.inform'),
                            processing: t('policy.table.actions.informing'),
                            resources: [policy],
                            description: t('policy.modal.message.inform'),
                            keyFn: (policy: Policy) => policy.metadata.uid as string,
                            actionFn: (policy) => {
                                return patchResource(
                                    {
                                        apiVersion: PolicyApiVersion,
                                        kind: PolicyKind,
                                        metadata: {
                                            name: policy.metadata.name,
                                            namespace: policy.metadata.namespace,
                                        },
                                    } as Policy,
                                    [{ op: 'replace', path: '/spec/remediationAction', value: 'inform' }]
                                )
                            },
                            close: () => {
                                setModalProps({ open: false })
                            },
                        })
                    },
                },
                {
                    id: 'enforce-policy',
                    title: t('policy.table.actions.enforce'),
                    tooltip: policy.spec.remediationAction === 'enforce' ? 'Already enforcing' : 'Enforce policy',
                    isDisabled: policy.spec.remediationAction === 'enforce',
                    click: (policy: Policy) => {
                        setModalProps({
                            open: true,
                            title: t('policy.modal.title.enforce'),
                            action: t('policy.table.actions.enforce'),
                            processing: t('policy.table.actions.enforcing'),
                            resources: [policy],
                            description: t('policy.modal.message.enforce'),
                            keyFn: (policy: Policy) => policy.metadata.uid as string,
                            actionFn: (policy) => {
                                return patchResource(
                                    {
                                        apiVersion: PolicyApiVersion,
                                        kind: PolicyKind,
                                        metadata: {
                                            name: policy.metadata.name,
                                            namespace: policy.metadata.namespace,
                                        },
                                    } as Policy,
                                    [{ op: 'replace', path: '/spec/remediationAction', value: 'enforce' }]
                                )
                            },
                            close: () => {
                                setModalProps({ open: false })
                            },
                        })
                    },
                },
                {
                    id: 'edit-policy',
                    title: t('Edit'),
                    tooltip: 'Edit policy',
                    addSeparator: true,
                    click: (policy: Policy) => {
                        history.push(
                            NavigationPath.editPolicy
                                .replace(':namespace', policy.metadata.namespace!)
                                .replace(':name', policy.metadata.name!)
                        )
                    },
                },
                {
                    id: 'delete-policy',
                    title: t('Delete'),
                    // tooltip: 'Delete policy',
                    addSeparator: true,
                    click: (policy: Policy) => {
                        setModalProps({
                            open: true,
                            title: t('policy.modal.title.delete'),
                            action: t('delete'),
                            processing: t('deleting'),
                            resources: [policy],
                            description: t(
                                `Removing ${policy.metadata.name} is irreversible.  Select any associated resources that need to be deleted in addition to ${policy.metadata.name}.`
                            ),
                            keyFn: (policy: Policy) => policy.metadata.uid as string,
                            actionFn: (policy) => deletePolicy(policy, pbcheck, prcheck),
                            close: () => {
                                setModalProps({ open: false })
                                pbcheck = false
                                prcheck = false
                            },
                            checkBox: renderRelatedResourceCheckbox(placementRuleChecked, placementBindingChecked),
                            isDanger: true,
                            icon: 'warning',
                            confirmText: 'confirm',
                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                        })
                    },
                },
            ]
            return policyRowActions
        },
        [placementRuleChecked, placementBindingChecked]
    )

    const [namespaces] = useRecoilState(namespacesState)

    const filters = useMemo<ITableFilter<Policy>[]>(
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
                tableFilterFn: (selectedValues, policy) => {
                    if (selectedValues.includes('With violations')) {
                        if (policy.status?.compliant === 'NonCompliant') return true
                    }
                    if (selectedValues.includes('Without violations')) {
                        if (policy.status?.compliant === 'Compliant') return true
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
                tableFilterFn: (selectedValues, policy) => {
                    return selectedValues.includes(policy.metadata.namespace ?? '')
                },
            },
            {
                id: 'remediation',
                label: 'Remediation',
                options: [
                    { label: 'Inform', value: 'inform' },
                    { label: 'Enforce', value: 'enforce' },
                ],
                tableFilterFn: (selectedValues, policy) => {
                    return selectedValues.includes(policy.spec.remediationAction)
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
                tableFilterFn: (selectedValues, policy) => {
                    if (selectedValues.includes('True')) {
                        if (!policy.spec.disabled) return true
                    }
                    if (selectedValues.includes('False')) {
                        if (policy.spec.disabled) return true
                    }
                    return false
                },
            },
        ],
        [namespaces]
    )

    const [compact, setCompact] = useState(false)

    useEffect(() => {
        function handleResize() {
            setCompact(window.innerWidth < 1200)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    let activeColumns = policyColumns
    let subColumns: IAcmTableColumn<Policy>[] | undefined = undefined

    if (compact) {
        activeColumns = policyColumns.filter((column) => {
            switch (column.header) {
                case t('Controls'):
                case t('Categories'):
                case t('Standards'):
                case t('Created'):
                    return false
            }
            return true
        })
        subColumns = policyColumns.filter((column) => {
            switch (column.header) {
                case t('Controls'):
                case t('Categories'):
                case t('Standards'):
                case t('Created'):
                    return true
            }
            return false
        })
    }

    if (policies.length === 0) {
        return <GovernanceCreatePolicyEmptyState />
    }

    return (
        <PageSection isWidthLimited>
            <BulkActionModel<Policy> {...modalProps} />
            <AcmTable<Policy>
                plural={t('Policies')}
                columns={activeColumns}
                keyFn={policyKeyFn}
                items={policies}
                rowActionResolver={rowActionResolver}
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
                addSubRows={(policy) => {
                    if (!subColumns) return undefined
                    return [
                        {
                            fullWidth: true,
                            cells: [
                                {
                                    title: (
                                        <div style={{ marginLeft: 106, marginTop: '20px', marginBottom: '20px' }}>
                                            <DescriptionList isAutoFit isAutoColumnWidths>
                                                {subColumns.map((column) => (
                                                    <DescriptionListGroup>
                                                        <DescriptionListTerm>{column.header}</DescriptionListTerm>
                                                        <DescriptionListDescription>
                                                            {typeof column.cell === 'string'
                                                                ? column.cell
                                                                : column.cell(policy)}
                                                        </DescriptionListDescription>
                                                    </DescriptionListGroup>
                                                ))}
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
): IAcmTableColumn<Policy> {
    const { t } = useTranslation()
    return {
        header: t('Cluster violations'),
        cell: (policy) => {
            const clusterViolationSummary = policyClusterViolationSummaryMap[policy.metadata.uid ?? '']
            if (clusterViolationSummary) {
                // TODO - add url seearch params when ready to soort/filter by violation type
                return (
                    <ClusterPolicyViolationIcons2
                        compliant={clusterViolationSummary.compliant}
                        compliantHref={`${NavigationPath.policyDetailsResults
                            .replace(':namespace', policy.metadata?.namespace ?? '')
                            .replace(':name', policy.metadata?.name ?? '')}`}
                        noncompliant={clusterViolationSummary.noncompliant}
                        violationHref={`${NavigationPath.policyDetailsResults
                            .replace(':namespace', policy.metadata?.namespace ?? '')
                            .replace(':name', policy.metadata?.name ?? '')}`}
                    />
                )
            } else {
                return '-'
            }
        },
        sort: (lhs, rhs) => {
            const lhsViolations = policyClusterViolationSummaryMap[lhs.metadata.uid ?? '']
            const rhsViolations = policyClusterViolationSummaryMap[rhs.metadata.uid ?? '']
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
