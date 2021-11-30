/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmTable,
    IAcmRowAction,
    IAcmTableAction,
    IAcmTableColumn,
    ITableFilter,
} from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    Checkbox,
    Chip,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    PageSection,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import moment from 'moment'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { NoWrap } from '../../../components/NoWrap'
import { deletePolicy } from '../../../lib/delete-policy'
import { patchResource, ResourceErrorCode, Policy, PolicyApiVersion, PolicyKind } from '../../../resources'
import { PolicyRiskLabels } from '../components/PolicyRiskLabels'
import { IGovernanceData, IPolicy } from '../useGovernanceData'

export default function PoliciesPage(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props

    const { t } = useTranslation()
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
                    // let compliantCount = 0
                    // let noncompliantCount = 0
                    // if (policy.status?.status) {
                    //     compliantCount = policy.status.status.filter(
                    //         (cluster) => cluster.compliant === 'Compliant'
                    //     ).length
                    //     noncompliantCount = policy.status.status.filter(
                    //         (cluster) => cluster.compliant === 'NonCompliant'
                    //     ).length
                    // }
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
                    )
                },
                sort: 'metadata.name',
                search: 'metadata.name',
            },
            // {
            //     header: t('Namespace'),
            //     cell: 'metadata.namespace',
            //     sort: 'metadata.namespace',
            //     search: 'metadata.namespace',
            // },
            {
                header: t('Clusters'),
                cell: (policy) => {
                    if (policy.status?.status) {
                        return (
                            <Fragment>
                                <PolicyRiskLabels
                                    risks={policy.clusterRisks}
                                    singular="cluster"
                                    plural="clusters"
                                    showLabels
                                    isVertical
                                />
                            </Fragment>
                        )
                    } else {
                        return <Fragment />
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
            // {
            //     header: t('Severity'),
            //     cell: (policy) => {
            //         switch (getPolicySeverity(policy)) {
            //             case PolicySeverity.Low:
            //                 return 'Low'
            //             case PolicySeverity.Medium:
            //                 return 'Medium'
            //             default:
            //             case PolicySeverity.High:
            //                 return 'High'
            //         }
            //     },
            //     sort: (lhs, rhs) => compareNumbers(getPolicySeverity(lhs), getPolicySeverity(rhs)),
            // },
            {
                header: t('Status'),
                cell: (policy: Policy) => <span>{policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>,
            },
            {
                header: t('Remediation'),
                cell: 'spec.remediationAction',
                sort: 'spec.remediationAction',
            },
            // {
            //     header: t('Source'),
            //     cell: () => 'TODO',
            // },
            {
                header: t('Controls'),
                cell: (policy) => {
                    const controls = policy.metadata.annotations?.['policy.open-cluster-management.io/controls']
                    if (!controls) return <Fragment />
                    return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {controls
                                .split(',')
                                .map((v) => v.trim())
                                .map((group) => (
                                    <Chip isReadOnly>{group}</Chip>
                                ))}
                        </div>
                    )
                },
            },
            // {
            //     header: t('Automation'),
            //     cell: () => 'TODO',
            // },
            {
                header: t('Categories'),
                cell: (policy) => {
                    const categories = policy.metadata.annotations?.['policy.open-cluster-management.io/categories']
                    if (!categories) return <Fragment />
                    return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {categories
                                .split(',')
                                .map((v) => v.trim())
                                .map((group) => (
                                    <Chip isReadOnly>{group}</Chip>
                                ))}
                        </div>
                        // <LabelGroup>
                        //     {categories
                        //         .split(',')
                        //         .map((v) => v.trim())
                        //         .map((category) => (
                        //             <div color={policy.spec.disabled ? 'grey' : 'blue'}>{category}</div>
                        //         ))}
                        // </LabelGroup>
                    )
                },
            },
            {
                header: t('Standards'),
                cell: (policy) => {
                    const standards = policy.metadata.annotations?.['policy.open-cluster-management.io/standards']
                    if (!standards) return <Fragment />
                    return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {standards
                                .split(',')
                                .map((v) => v.trim())
                                .map((group) => (
                                    <Chip isReadOnly>{group}</Chip>
                                ))}
                        </div>
                    )
                },
            },
            {
                header: t('Created'),
                cell: (resource) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        {resource.metadata.creationTimestamp &&
                            moment(new Date(resource.metadata.creationTimestamp)).fromNow()}
                    </span>
                ),
                sort: 'metadata.creationTimestamp',
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
                    label={t('Associated PlacementBindings')}
                />
                <Checkbox
                    id={'remove-placementRule'}
                    isChecked={placementRuleChecked}
                    onClick={() => handlePlacementRuleChecked()}
                    label={t('Associated PlacementRules')}
                />
            </Fragment>
        )
    }

    const bulkModalStatusColumns = [
        {
            header: t('Policy name'),
            cell: 'metadata.name',
            sort: 'metadata.name',
        },
        {
            header: t('Status'),
            cell: (policy: Policy) => <span>{policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>,
        },
    ]

    const bulkModalRemediationColumns = [
        {
            header: t('Policy name'),
            cell: 'metadata.name',
            sort: 'metadata.name',
        },
        {
            header: t('Status'),
            cell: (policy: Policy) => (
                <span>{policy.spec.remediationAction === t('Inform').toLowerCase() ? t('Inform') : t('Enforce')}</span>
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
                        action: t('common:delete'),
                        processing: t('common:deleting'),
                        resources: [...policies],
                        description: t('bulk.message.delete'),
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
                title: t('Add to Policy Set'),
                click: () => {},
            },
            {
                id: 'seperator-1',
                variant: 'action-seperator',
            },
            {
                variant: 'action-group',
                id: 'status',
                title: t('Status'),
                actions: [
                    {
                        variant: 'bulk-action',
                        id: 'enable',
                        title: t('Enable'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('Enable policy'),
                                action: t('Enable'),
                                processing: t('Enabling'),
                                resources: [...policies],
                                description: t(
                                    'After you enable the selected policies, policies are ready to report violations or run remediations as defined in the source.'
                                ),
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
                        title: t('Disable'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('Disable policy'),
                                action: t('Disable'),
                                processing: t('Disabling'),
                                resources: [...policies],
                                description: t(
                                    'After you disable the selected policies, violations are no longer reported and remediation actions cease.'
                                ),
                                columns: [
                                    {
                                        header: t('Policy name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('Status'),
                                        cell: (policy) => (
                                            <span>{policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>
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
                title: t('Remediation'),
                actions: [
                    {
                        variant: 'bulk-action',
                        id: 'inform',
                        title: t('Inform'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('Inform policy'),
                                action: t('Inform'),
                                processing: t('Informing'),
                                resources: [...policies],
                                description: t(
                                    'After you set the selected policies to inform, violations are reported and manual remediation is required.'
                                ),
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
                        title: t('Enforce'),
                        click: (policies) => {
                            setModalProps({
                                open: true,
                                title: t('Enforce policy'),
                                action: t('Enforce'),
                                processing: t('Enforcing'),
                                resources: [...policies],
                                description: t(
                                    'After you set the selected policies to enforce, remediation actions run automatically as defined in the resource.'
                                ),
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
                        title: t('Permanently delete policy?'),
                        action: t('Delete'),
                        processing: t('Deleting'),
                        resources: [policy],
                        // TODO - Handle interpolation
                        description: t(
                            'Removing {{name}} is irreversible. Select any associated resources that need to be deleted in addition to {{name}}.'
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
            {
                id: 'enable-policy',
                title: t('Enable'),
                tooltip: 'desc or disabled message',
                addSeparator: true,
                isDisabled: false,
                click: (policy) => {
                    setModalProps({
                        open: true,
                        title: t('Enable policy'),
                        action: t('Enable'),
                        processing: t('Enabling'),
                        resources: [policy],
                        description: t(
                            'After you enable the selected policies, policies are ready to report violations or run remediations as defined in the source.'
                        ),
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
                title: t('Disable'),
                tooltip: 'desc or disabled message',
                isDisabled: false,
                click: (policy) => {
                    setModalProps({
                        open: true,
                        title: t('Disable policy'),
                        action: t('Disable'),
                        processing: t('Disabling'),
                        resources: [policy],
                        description: t(
                            'After you disable the selected policies, violations are no longer reported and remediation actions cease.'
                        ),
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
                title: t('Inform'),
                tooltip: 'desc or disabled message',
                addSeparator: true,
                isDisabled: false,
                click: (policy: Policy) => {
                    setModalProps({
                        open: true,
                        title: t('Inform policy'),
                        action: t('Inform'),
                        processing: t('Informing'),
                        resources: [policy],
                        description: t(
                            'After you set the selected policies to inform, violations are reported and manual remediation is required.'
                        ),
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
                title: t('Enforce'),
                tooltip: 'desc or disabled message',
                isDisabled: false,
                click: (policy) => {
                    setModalProps({
                        open: true,
                        title: t('Enforce policy'),
                        action: t('Enforce'),
                        processing: t('Enforcing'),
                        resources: [policy],
                        description: t(
                            'After you set the selected policies to enforce, remediation actions run automatically as defined in the resource.'
                        ),
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
                        click: () => {},
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
