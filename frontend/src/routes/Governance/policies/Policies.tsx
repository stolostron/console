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
import { AcmTable, IAcmRowAction, IAcmTableAction, IAcmTableColumn, ITableFilter } from '@stolostron/ui-components'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policySetsState } from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { NoWrap } from '../../../components/NoWrap'
import { useTranslation } from '../../../lib/acm-i18next'
import { deletePolicy } from '../../../lib/delete-policy'
import { NavigationPath } from '../../../NavigationPath'
import { patchResource, Policy, PolicyApiVersion, PolicyKind, PolicySet, ResourceErrorCode } from '../../../resources'
import { ClusterPolicyViolationIcons } from '../components/ClusterPolicyViolations'
import { GovernanceCreatePolicyEmptyState } from '../components/GovernanceEmptyState'
import { IGovernanceData, IPolicy } from '../useGovernanceData'
import { PolicySetList } from './util'

export default function PoliciesPage(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props
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
    const policyColumns = useMemo<IAcmTableColumn<IPolicy>[]>(
        () => [
            {
                header: t('Name'),
                cell: (policy) => {
                    return (
                        <Fragment>
                            <div>
                                <NoWrap>
                                    {/* <RisksIcon risks={policy.clusterRisks} />
                            &nbsp;&nbsp; */}
                                    {/* <ExclamationCircleIcon color="red" /> &nbsp; */}
                                    <a>{policy.metadata.name}</a>
                                </NoWrap>
                            </div>
                            <div style={{ opacity: 0.7, fontSize: 'smaller' }}>ns: {policy.metadata.namespace}</div>
                        </Fragment>
                        // <Link
                        //     to={{
                        //         pathname: NavigationPath.policyDetails
                        //             .replace(':namespace', policy.metadata.namespace as string)
                        //             .replace(':name', policy.metadata.name as string),
                        //         state: {
                        //             from: NavigationPath.policies,
                        //         },
                        //     }}
                        // >
                        //     {policy.metadata.name}
                        // </Link>
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
            {
                header: t('Cluster violations'),
                cell: (policy) => {
                    if (policy.status?.status) {
                        // TODO - add link to the policy details page clusters tab
                        return <ClusterPolicyViolationIcons risks={policy.clusterRisks} />
                    } else {
                        return '-'
                    }
                },
                sort: (lhs, rhs) => {
                    if (lhs.clusterRisks.high > rhs.clusterRisks.high) return -1
                    if (lhs.clusterRisks.high < rhs.clusterRisks.high) return 1
                    if (lhs.clusterRisks.medium > rhs.clusterRisks.medium) return -1
                    if (lhs.clusterRisks.medium < rhs.clusterRisks.medium) return 1
                    if (lhs.clusterRisks.low > rhs.clusterRisks.low) return -1
                    if (lhs.clusterRisks.low < rhs.clusterRisks.low) return 1
                    if (lhs.clusterRisks.synced > rhs.clusterRisks.synced) return -1
                    if (lhs.clusterRisks.synced < rhs.clusterRisks.synced) return 1
                    return 0
                },
            },
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
        []
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

    const policyRowActions = useMemo<IAcmRowAction<Policy>[]>(
        () => [
            {
                id: 'delete-policy',
                title: t('Delete'),
                click: (policy: Policy) => {
                    setModalProps({
                        open: true,
                        title: t('policy.modal.title.delete'),
                        action: t('delete'),
                        processing: t('deleting'),
                        resources: [policy],
                        description: t('policy.modal.message.confirm'),
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
            {
                id: 'enable-policy',
                title: t('policy.table.actions.enable'),
                tooltip: 'desc or disabled message',
                addSeparator: true,
                isDisabled: false,
                click: (policy) => {
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
                tooltip: 'desc or disabled message',
                isDisabled: false,
                click: (policy) => {
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
                tooltip: 'desc or disabled message',
                addSeparator: true,
                isDisabled: false,
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
                tooltip: 'desc or disabled message',
                isDisabled: false,
                click: (policy) => {
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
        ],
        [placementRuleChecked, placementBindingChecked]
    )

    const namespaces = useMemo(() => {
        return Object.keys(
            governanceData.policies.reduce((namespaces, policy) => {
                if (policy.metadata.namespace) {
                    namespaces[policy.metadata.namespace] = true
                }
                return namespaces
            }, {} as Record<string, true>)
        )
    }, [governanceData.policies])

    const filters = useMemo<ITableFilter<IPolicy>[]>(
        () => [
            {
                id: 'compliance',
                label: 'Compliance',
                options: [
                    {
                        label: 'Compliant',
                        value: 'Compliant',
                    },
                    {
                        label: 'Noncompliant',
                        value: 'NonCompliant',
                    },
                ],
                tableFilterFn: (selectedValues, policy) => {
                    if (selectedValues.includes('NonCompliant')) {
                        if (policy.clusterRisks.high || policy.clusterRisks.medium || policy.clusterRisks.low)
                            return true
                    }
                    if (selectedValues.includes('Compliant')) {
                        if (policy.clusterRisks.synced) return true
                    }
                    return false
                },
            },
            {
                id: 'namespace',
                label: 'Namespace',
                options: namespaces.map((namespace) => ({
                    label: namespace,
                    value: namespace,
                })),
                tableFilterFn: (selectedValues, policy) => {
                    return selectedValues.includes(policy.metadata.namespace ?? '')
                },
            },
            {
                id: 'remediation',
                label: 'Remediation',
                options: [{ label: 'Inform', value: 'inform' }],
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
    let subColumns: IAcmTableColumn<IPolicy>[] | undefined = undefined

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

    if (!governanceData.policies || governanceData.policies.length === 0) {
        return <GovernanceCreatePolicyEmptyState />
    }

    return (
        <PageSection>
            <BulkActionModel<Policy> {...modalProps} />
            <AcmTable<IPolicy>
                plural={t('Policies')}
                columns={activeColumns}
                keyFn={policyKeyFn}
                items={governanceData.policies}
                rowActions={policyRowActions}
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
