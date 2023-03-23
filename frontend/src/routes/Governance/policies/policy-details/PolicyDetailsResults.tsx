/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Title, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmEmptyState, AcmTable, AcmTablePaginationContextProvider, compareStrings } from '../../../../ui-components'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import { generatePath, Link } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { checkPermission, rbacCreate } from '../../../../lib/rbac-util'
import { transformBrowserUrlToFilterPresets } from '../../../../lib/urlQuery'
import { NavigationPath } from '../../../../NavigationPath'
import { getGroupFromApiVersion, Policy, PolicyDefinition, PolicyStatusDetails } from '../../../../resources'

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
  const filterPresets = transformBrowserUrlToFilterPresets(window.location.search)
  const { policy } = props
  const { namespacesState, policiesState } = useSharedAtoms()
  const [policies] = useRecoilState(policiesState)
  const [namespaces] = useRecoilState(namespacesState)
  const [canCreatePolicy, setCanCreatePolicy] = useState<boolean>(false)

  useEffect(() => {
    checkPermission(rbacCreate(PolicyDefinition), setCanCreatePolicy, namespaces)
  }, [namespaces])

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
        header: t('Cluster'),
        sort: 'clusterNamespace',
        cell: (item: resultsTableData) => (
          <Link
            to={{
              pathname: generatePath(NavigationPath.clusterOverview, {
                name: item.cluster,
                namespace: item.clusterNamespace || '~managed-cluster',
              }),
            }}
          >
            {item.clusterNamespace}
          </Link>
        ),
        search: (item: resultsTableData) => item.clusterNamespace,
      },
      {
        header: t('Violations'),
        sort: (itemA: any, itemB: any) => {
          const messageA = itemA.message ?? '-'
          const compliantA = messageA && typeof messageA === 'string' ? messageA.split(';')[0] : '-'
          const messageB = itemB.message ?? '-'
          const compliantB = messageB && typeof messageB === 'string' ? messageB.split(';')[0] : '-'
          return compareStrings(compliantA, compliantB)
        },
        cell: (item: resultsTableData) => {
          const message = item.message ?? '-'
          let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
          compliant = compliant ? compliant.trim().toLowerCase() : '-'
          switch (compliant) {
            case 'compliant':
              return (
                <div>
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('Without violations')}
                </div>
              )
            case 'noncompliant':
              return (
                <div>
                  <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('With violations')}
                </div>
              )
            case 'pending':
              return (
                <div>
                  <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Pending')}
                </div>
              )
            default:
              return (
                <div>
                  <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                </div>
              )
          }
        },
      },
      {
        header: t('Template'),
        sort: 'templateName',
        cell: (item: resultsTableData) => item.templateName,
        search: (item: resultsTableData) => item.templateName,
      },
      {
        header: t('Message'),
        sort: 'message',
        cell: (item: resultsTableData) => {
          const policyName = item?.policyName
          const policyNamespace = item?.policyNamespace
          const cluster = item?.cluster
          const templateName = item?.templateName
          const apiVersion = item?.apiVersion
          const kind = item?.kind
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
          if (prunedMessage && policyName && policyNamespace && cluster && templateName && apiVersion && kind) {
            const { apiGroup, version } = getGroupFromApiVersion(apiVersion)
            const templateDetailURL = NavigationPath.policyTemplateDetails
              .replace(':namespace', policyNamespace)
              .replace(':name', policyName)
              .replace(':clusterName', cluster)
              .replace(':apiGroup/', apiGroup ? `${apiGroup}/` : '')
              .replace(':apiVersion', version)
              .replace(':kind', kind)
              .replace(':templateName', templateName)
            const templateLink = canCreatePolicy ? (
              templateDetailURL && (
                <span>
                  -<Link to={templateDetailURL}>{` ${t('View details')}`}</Link>
                </span>
              )
            ) : (
              <Tooltip content={t('rbac.unauthorized')}>
                <span className="link-disabled">{`- ${t('View details')}`}</span>
              </Tooltip>
            )
            const templateExists = !(
              prunedMessage.includes('Failed to create policy template') ||
              prunedMessage.includes('check if you have CRD deployed') ||
              prunedMessage.includes('Dependencies were not satisfied')
            )
            return (
              <div>
                {/* message may need to be limited to 300 chars? */}
                {prunedMessage} {templateExists && templateLink}
              </div>
            )
          }
          return '-'
        },
        search: (item: resultsTableData) => item.message,
      },
      {
        header: t('Last report'),
        sort: 'timestamp',
        cell: (item: resultsTableData) =>
          item.timestamp ? moment(item.timestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow() : '-',
      },
      {
        header: t('History'),
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
    [canCreatePolicy, t]
  )

  return (
    <PageSection>
      <Title headingLevel="h3">{t('Clusters')}</Title>
      <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
        <AcmTable<resultsTableData>
          items={policiesDeployedOnCluster}
          emptyState={
            <AcmEmptyState
              title={t('No cluster results')}
              message={t('No clusters are reporting status for this policy.')}
            />
          }
          columns={columns}
          keyFn={(item) => `${item.clusterNamespace}.${item.templateName}`}
          initialSort={
            window.location.search === ''
              ? {
                  index: 1,
                  direction: 'desc',
                }
              : filterPresets.initialSort
          }
          initialSearch={filterPresets.initialSearch}
          searchPlaceholder={t('Find clusters')}
          fuseThreshold={0}
        />
      </AcmTablePaginationContextProvider>
    </PageSection>
  )
}
