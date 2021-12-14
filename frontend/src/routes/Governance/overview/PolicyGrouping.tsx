/* Copyright Contributors to the Open Cluster Management project */

import { AcmTable, IAcmTableColumn, ITableFilter } from '@open-cluster-management/ui-components'
import { Fragment, useCallback, useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { NoWrap } from '../../../components/NoWrap'
import { PolicyRiskLabels } from '../components/PolicyRiskLabels'
import { IPolicyGroup, IPolicyGrouping } from '../useGovernanceData'

export function PolicyGrouping(props: { policyGrouping: IPolicyGrouping; title: string }) {
    const { t } = useTranslation()
    const categoryKeyFn = useCallback((group: IPolicyGroup) => group.name, [])
    const categoryColumns = useMemo<IAcmTableColumn<IPolicyGroup>[]>(
        () => [
            {
                header: t('Name'),
                cell: (group) => {
                    return (
                        <NoWrap>
                            {/* <RisksIcon risks={group.policyRisks} /> */}
                            {/* &nbsp;&nbsp; */}
                            <a>{group.name}</a>
                        </NoWrap>
                    )
                },
                sort: 'name',
                search: 'name',
            },
            {
                header: t('Policies'),
                cell: (group) => (
                    <PolicyRiskLabels
                        risks={group.policyRisks}
                        singular="policy"
                        plural="policies"
                        showLabels
                        isVertical
                    />
                ),
            },

            {
                header: t('Clusters'),
                cell: (group) => (
                    <PolicyRiskLabels
                        risks={group.clusterRisks}
                        singular="cluster"
                        plural="clusters"
                        isVertical
                        showLabels
                    />
                ),
            },
        ],
        []
    )

    const filters = useMemo<ITableFilter<IPolicyGroup>[]>(
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
                tableFilterFn: (selectedValues, group) => {
                    if (selectedValues.includes('NonCompliant')) {
                        if (group.policyRisks.high || group.policyRisks.medium || group.policyRisks.low) return true
                    }
                    if (selectedValues.includes('Compliant')) {
                        if (group.policyRisks.synced) return true
                    }
                    return false
                },
            },
        ],
        []
    )

    return (
        // <TableCard title={props.title} summary={<PolicyRiskLabels risks={props.policyGrouping.risks} />}>
        <Fragment>
            {/* <PageSection variant="light" style={{ paddingBottom: 8 }}>
                <PolicyRiskLabels risks={props.policyGrouping.risks} showLabels />
            </PageSection> */}
            <AcmTable<IPolicyGroup>
                plural={t('Categories')}
                columns={categoryColumns}
                keyFn={categoryKeyFn}
                items={props.policyGrouping.groups}
                filters={filters}
            />
        </Fragment>
        // </TableCard>
    )
}
