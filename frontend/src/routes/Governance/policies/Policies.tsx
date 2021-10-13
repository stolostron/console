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
import { NoWrap } from '../../../components/NoWrap'
import { Policy } from '../../../resources/policy'
import { PolicyRiskLabels } from '../components/PolicyRiskLabels'
import { IGovernanceData, IPolicy } from '../useGovernanceData'

export default function PoliciesPage(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props

    const { t } = useTranslation(['govenance'])
    const policyKeyFn = useCallback(
        (resource: Policy) => resource.metadata.uid ?? `${resource.metadata.name}/${resource.metadata.namespace}`,
        []
    )
    const policyColumns = useMemo<IAcmTableColumn<IPolicy>[]>(
        () => [
            {
                header: t('Name'),
                cell: (policy) => {
                    let compliantCount = 0
                    let noncompliantCount = 0
                    if (policy.status?.status) {
                        compliantCount = policy.status.status.filter(
                            (cluster) => cluster.compliant === 'Compliant'
                        ).length
                        noncompliantCount = policy.status.status.filter(
                            (cluster) => cluster.compliant === 'NonCompliant'
                        ).length
                    }
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

    const tableActions = useMemo<IAcmTableAction<Policy>[]>(
        () => [
            {
                variant: 'bulk-action',
                id: 'delete-policy',
                title: t('Delete'),
                click: () => {},
            },
            {
                id: 'seperator-1',
                variant: 'action-seperator',
            },
            {
                variant: 'bulk-action',
                id: 'add-to-set',
                title: t('Add to policy set'),
                click: () => {},
            },
        ],
        []
    )

    const policyRowActions = useMemo<IAcmRowAction<Policy>[]>(
        () => [
            {
                id: 'delete-policy',
                title: t('Delete'),
                click: () => {},
            },
        ],
        []
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
