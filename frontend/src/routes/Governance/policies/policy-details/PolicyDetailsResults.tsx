/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmTable, AcmTablePaginationContextProvider } from '@stolostron/ui-components'
import _ from 'lodash'
import moment from 'moment'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policiesState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy } from '../../../../resources'

export default function PolicyDetailsResults(props: { policy: Policy }) {
    const { t } = useTranslation()
    const { policy } = props
    const [policies] = useRecoilState(policiesState)

    const policiesDeployedOnCluster: any[] = useMemo(() => {
        const policyName = policy.metadata.name ?? ''
        const policyNamespace = policy.metadata.namespace ?? ''
        const policyResponses: Policy[] = policies.filter(
            (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
        )
        const status: any = []
        policyResponses.forEach((policyResponse) => {
            const cluster = _.get(
                policyResponse,
                'metadata.labels["policy.open-cluster-management.io/cluster-name"]',
                '-'
            )
            const clusterNamespace = _.get(
                policyResponse,
                'metadata.labels["policy.open-cluster-management.io/cluster-namespace"]',
                '-'
            )
            const details = _.get(policyResponse, 'status.details', [])
            details.forEach((detail: any) => {
                const templates = _.get(policyResponse, 'spec.policy-templates', [])
                const template = templates.find(
                    (template: string) =>
                        _.get(template, 'objectDefinition.metadata.name', 'a') === _.get(detail, 'templateMeta.name'),
                    'b'
                )
                status.push({
                    templateName: _.get(detail, 'templateMeta.name', '-'),
                    cluster,
                    clusterNamespace,
                    apiVersion: _.get(template, 'objectDefinition.apiVersion', '-'),
                    kind: _.get(template, 'objectDefinition.kind', '-'),
                    status: _.get(detail, 'compliant', 'no-status'),
                    message: _.get(detail, 'history[0].message', '-'),
                    timestamp: _.get(detail, 'history[0].lastTimestamp'),
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
                cell: (item: any) => (
                    <Link
                        to={{
                            pathname: NavigationPath.clusterOverview.replace(':id', item.clusterNamespace),
                        }}
                    >
                        {item.clusterNamespace}
                    </Link>
                ),
                search: (item: any) => item.clusterNamespace,
            },
            {
                header: 'Compliance',
                cell: (item: any) => {
                    const message = _.get(item, 'message', '-')
                    let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
                    compliant = compliant ? compliant.trim().toLowerCase() : '-'
                    switch (compliant) {
                        case 'compliant':
                            return (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('Compliant')}
                                </div>
                            )
                        case 'noncompliant':
                            return (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />{' '}
                                    {t('Non compliant')}
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
                cell: (item: any) => item.templateName,
                search: (item: any) => item.templateName,
            },
            {
                header: 'Message',
                cell: (item: any) => {
                    const message = _.get(item, 'message')
                    const policyName = _.get(item, 'policyName')
                    const policyNamespace = _.get(item, 'policyNamespace')
                    const cluster = _.get(item, 'cluster')
                    const templateName = _.get(item, 'templateName')
                    const apiVersion = _.get(item, 'apiVersion')
                    const kind = _.get(item, 'kind')
                    if (message && policyName && policyNamespace && cluster && templateName && apiVersion && kind) {
                        // TODO this link does nothing....
                        // const templateDetailURL = `/multicloud/policies/all/${policyNamespace}/${policyName}/template/${cluster}/${apiVersion}/${kind}/${templateName}`
                        return (
                            <div>
                                {/* message may need to be limited to 300 chars? */}
                                {message}{' '}
                                {/* templateDetailURL && <Link to={templateDetailURL}>{t('View details')}</Link> */}
                            </div>
                        )
                    }
                    return '-'
                },
                search: (item: any) => item.message,
            },
            {
                header: 'Last report',
                cell: (item: any) => (item.timestamp ? moment(item.timestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow() : '-'),
            },
            {
                header: 'History',
                cell: (item: any) => {
                    const policyName = _.get(item, 'policyName')
                    const policyNamespace = _.get(item, 'policyNamespace')
                    const cluster = _.get(item, 'cluster')
                    const templateName = _.get(item, 'templateName')
                    if (policyName && policyNamespace && cluster && templateName) {
                        // TODO this link does nothing....
                        // const statusHistoryURL = `/multicloud/policies/all/${policyNamespace}/${policyName}/status/${cluster}/templates/${templateName}/history`
                        // return <Link to={statusHistoryURL}>{t('View history')}</Link>
                        return '-'
                    }
                    return '-'
                },
            },
        ],
        [policiesDeployedOnCluster]
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
