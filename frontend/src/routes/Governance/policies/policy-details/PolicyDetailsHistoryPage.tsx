/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmPage, AcmPageHeader, AcmTable, AcmTablePaginationContextProvider } from '@stolostron/ui-components'
import moment from 'moment'
import { Fragment, Suspense, useMemo } from 'react'
import { Route, Switch, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policiesState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy, PolicyStatusDetails } from '../../../../resources'

interface HistoryTableData {
    message: string
    timestamp: moment.MomentInput
}

export function PolicyDetailsHistoryPage() {
    const { t } = useTranslation()
    const [policies] = useRecoilState(policiesState)

    const urlParams = useParams<{ namespace: string; name: string; clusterName: string; templateName: string }>()
    const policyNamespace = urlParams.namespace
    const policyName = urlParams.name
    const clusterName = urlParams.clusterName
    const templateName = urlParams.templateName

    const historyUrl = NavigationPath.policyDetailsHistory
        .replace(':namespace', policyNamespace as string)
        .replace(':name', policyName as string)
        .replace(':clusterName', clusterName as string)
        .replace(':templateName', templateName as string)

    const statusItems: HistoryTableData[] = useMemo(() => {
        if (!(policyName && policyNamespace && clusterName && templateName)) {
            return []
        }
        const policyResponses: Policy[] = policies.filter(
            (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
        )
        const statuses: HistoryTableData[] = []
        policyResponses.forEach((policyResponse) => {
            let details: PolicyStatusDetails[] = policyResponse.status?.details ?? []
            details = details.filter((detail) => {
                if (detail?.templateMeta?.name === templateName) {
                    return true
                }
                return false
            })
            details.forEach((detail: PolicyStatusDetails) => {
                const history = detail.history ?? []
                history.forEach((status) => {
                    statuses.push({
                        message: status.message ?? '-',
                        timestamp: status.lastTimestamp ?? '-',
                    })
                })
            })
        })
        return statuses
    }, [policyName, policyNamespace, clusterName, templateName])

    const columns = useMemo(
        () => [
            {
                header: 'Violations',
                cell: (item: any) => {
                    const message = item.message ?? '-'
                    let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
                    compliant = compliant ? compliant.trim().toLowerCase() : '-'
                    switch (compliant) {
                        case 'compliant':
                            return (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                    {t('Without violations')}
                                </div>
                            )
                        case 'noncompliant':
                            return (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />{' '}
                                    {t('With violations')}
                                </div>
                            )
                        default:
                            return (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {t('No status')}
                                </div>
                            )
                    }
                },
            },
            {
                header: 'Message',
                cell: (item: any) => {
                    const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
                    return prunedMessage ? prunedMessage : '-'
                },
                search: (item: any) => item.message,
            },
            {
                header: 'Last report',
                cell: (item: any) => (item.timestamp ? moment(item.timestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow() : '-'),
            },
        ],
        []
    )

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('History')}
                    breadcrumb={[
                        { text: t('Policies'), to: NavigationPath.policies },
                        {
                            text: policyName,
                            to: NavigationPath.policyDetailsResults
                                .replace(':namespace', policyNamespace as string)
                                .replace(':name', policyName as string),
                        },
                        { text: t('History'), to: '' },
                    ]}
                    popoverAutoWidth={false}
                    popoverPosition="bottom"
                />
            }
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route
                        exact
                        path={historyUrl}
                        render={() => (
                            <div>
                                {statusItems.map((item) => (
                                    <PageSection>
                                        <Title headingLevel="h3">{clusterName}</Title>
                                        <Title headingLevel="h4">{t(`Template: ${templateName}`)}</Title>
                                        <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
                                            <AcmTable
                                                items={[item]}
                                                columns={columns}
                                                keyFn={(item) => `${item.message}.${item.timestamp}`}
                                                initialSort={{
                                                    index: 1,
                                                    direction: 'desc',
                                                }}
                                                fuseThreshold={0}
                                                plural={t('clusters')}
                                            />
                                        </AcmTablePaginationContextProvider>
                                    </PageSection>
                                ))}
                            </div>
                        )}
                    />
                </Switch>
            </Suspense>
        </AcmPage>
    )
}
