/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmTable, AcmTablePaginationContextProvider } from '@stolostron/ui-components'
import moment from 'moment'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policiesState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { getGroupFromApiVersion, Policy, PolicyStatusDetails } from '../../../../resources'

interface resultsTableData {
    templateName: string
    cluster: string
    clusterNamespace: string
    apiVersion: string
    kind: string
    status: string
    message: string
    timestamp: moment.MomentInput
    policyName: string
    policyNamespace: string
}

export default function PolicyDetailsResults(props: { policy: Policy }) {
    const { t } = useTranslation()
    const { policy } = props
    const [policies] = useRecoilState(policiesState)

    const policiesDeployedOnCluster: resultsTableData[] = useMemo(() => {
        const policyName = policy.metadata.name ?? ''
        const policyNamespace = policy.metadata.namespace ?? ''
        const policyResponses: Policy[] = policies.filter(
            (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
        )
        const status: resultsTableData[] = []
        policyResponses.length > 0 &&
            policyResponses.forEach((policyResponse: Policy) => {
                const cluster =
                    (policyResponse?.metadata?.labels &&
                        policyResponse.metadata.labels['policy.open-cluster-management.io/cluster-name']) ??
                    '-'
                const clusterNamespace =
                    (policyResponse?.metadata?.labels &&
                        policyResponse?.metadata?.labels['policy.open-cluster-management.io/cluster-namespace']) ??
                    '-'
                const details = policyResponse?.status?.details ?? []
                details.forEach((detail: PolicyStatusDetails) => {
                    const templates = policyResponse?.spec['policy-templates'] ?? []
                    const template = templates.find(
                        (template: any) => template?.objectDefinition?.metadata?.name === detail?.templateMeta?.name
                    )
                    status.push({
                        templateName: detail.templateMeta.name ?? '-',
                        cluster,
                        clusterNamespace,
                        apiVersion: template?.objectDefinition.apiVersion ?? '-',
                        kind: template?.objectDefinition.kind ?? '-',
                        status: detail.compliant ?? 'no-status',
                        message: (detail?.history && detail.history[0]?.message) ?? '-',
                        timestamp: detail?.history && detail?.history[0]?.lastTimestamp,
                        policyName,
                        policyNamespace,
                    })
                })
            })
        return status
    }, [policy, policies])

    const columns = useMemo(
        () => [
            {
                header: 'Cluster',
                cell: (item: resultsTableData) => (
                    <Link
                        to={{
                            pathname: NavigationPath.clusterOverview.replace(':id', item.clusterNamespace),
                        }}
                    >
                        {item.clusterNamespace}
                    </Link>
                ),
                search: (item: resultsTableData) => item.clusterNamespace,
            },
            {
                header: 'Violations',
                cell: (item: resultsTableData) => {
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
                header: 'Template',
                cell: (item: resultsTableData) => item.templateName,
                search: (item: resultsTableData) => item.templateName,
            },
            {
                header: 'Message',
                cell: (item: resultsTableData) => {
                    const policyName = item?.policyName
                    const policyNamespace = item?.policyNamespace
                    const cluster = item?.cluster
                    const templateName = item?.templateName
                    const apiVersion = item?.apiVersion
                    const kind = item?.kind
                    const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
                    if (
                        prunedMessage &&
                        policyName &&
                        policyNamespace &&
                        cluster &&
                        templateName &&
                        apiVersion &&
                        kind
                    ) {
                        const { apiGroup, version } = getGroupFromApiVersion(apiVersion)
                        const templateDetailURL = NavigationPath.policyTemplateDetails
                            .replace(':namespace', policyNamespace)
                            .replace(':name', policyName)
                            .replace(':clusterName', cluster)
                            .replace(':apiGroup/', apiGroup ? `${apiGroup}/` : '')
                            .replace(':apiVersion', version)
                            .replace(':kind', kind)
                            .replace(':templateName', templateName)
                        return (
                            <div>
                                {/* message may need to be limited to 300 chars? */}
                                {prunedMessage}{' '}
                                {templateDetailURL && <Link to={templateDetailURL}>{t('View details')}</Link>}
                            </div>
                        )
                    }
                    return '-'
                },
                search: (item: resultsTableData) => item.message,
            },
            {
                header: 'Last report',
                cell: (item: resultsTableData) =>
                    item.timestamp ? moment(item.timestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow() : '-',
            },
            {
                header: 'History',
                cell: (item: resultsTableData) => {
                    const policyName = item?.policyName
                    const policyNamespace = item?.policyNamespace
                    const cluster = item?.cluster
                    const templateName = item?.templateName
                    if (policyName && policyNamespace && cluster && templateName) {
                        const statusHistoryURL = NavigationPath.policyDetailsHistory
                            .replace(':namespace', policyNamespace)
                            .replace(':name', policyName)
                            .replace(':clusterName', cluster)
                            .replace(':templateName', templateName)
                        return <Link to={statusHistoryURL}>{t('View history')}</Link>
                    }
                    return '-'
                },
            },
        ],
        [t]
    )

    return (
        <PageSection>
            <Title headingLevel="h3">{t('Clusters')}</Title>
            <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
                <AcmTable
                    items={policiesDeployedOnCluster}
                    columns={columns}
                    keyFn={(item) => `${item.clusterNamespace}.${item.templateName}`}
                    initialSort={{
                        index: 1,
                        direction: 'desc',
                    }}
                    searchPlaceholder={t('Find clusters')}
                    fuseThreshold={0}
                    plural={t('clusters')}
                />
            </AcmTablePaginationContextProvider>
        </PageSection>
    )
}
