/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Title, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmEmptyState, AcmTable, AcmTablePaginationContextProvider, compareStrings } from '../../../../ui-components'
import { useEffect, useMemo, useState } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { useTranslation } from '../../../../lib/acm-i18next'
import { checkPermission, rbacCreate } from '../../../../lib/rbac-util'
import { transformBrowserUrlToFilterPresets } from '../../../../lib/urlQuery'
import { NavigationPath, UNKNOWN_NAMESPACE } from '../../../../NavigationPath'
import { getGroupFromApiVersion, Policy, PolicyDefinition, PolicyStatusDetails } from '../../../../resources'
import { getPolicyTempRemediation } from '../../common/util'
import { ViewDiffApiCall } from '../../components/ViewDiffApiCall'
import { usePolicyDetailsContext } from './PolicyDetailsPage'
import { fromNow } from '../../../../resources/utils/datetime'

export interface ResultsTableData {
  templateName: string
  cluster: string
  clusterNamespace: string
  apiVersion: string
  kind: string
  status: string
  message: string
  timestamp: string | number | Date
  policyName: string
  policyNamespace: string
  remediationAction: string
}

function getTemplateDetailURL(item: ResultsTableData) {
  const policyName = item?.policyName
  const policyNamespace = item?.policyNamespace
  const cluster = item?.cluster
  const templateName = item?.templateName
  const apiVersion = item?.apiVersion
  const kind = item?.kind
  const { apiGroup, version } = getGroupFromApiVersion(apiVersion)
  return generatePath(NavigationPath.policyTemplateDetails, {
    namespace: policyNamespace,
    name: policyName,
    clusterName: cluster,
    apiGroup,
    apiVersion: version,
    kind,
    templateName,
  })
}

export default function PolicyDetailsResults() {
  const { t } = useTranslation()
  const filterPresets = transformBrowserUrlToFilterPresets(window.location.search)
  const { policy } = usePolicyDetailsContext()
  const { namespacesState, policiesState } = useSharedAtoms()
  const policies = useRecoilValue(policiesState)
  const namespaces = useRecoilValue(namespacesState)
  const [canCreatePolicy, setCanCreatePolicy] = useState<boolean>(false)

  useEffect(() => {
    checkPermission(rbacCreate(PolicyDefinition), setCanCreatePolicy, namespaces)
  }, [namespaces])

  const policiesDeployedOnCluster: ResultsTableData[] = useMemo(() => {
    const policyName = policy.metadata.name ?? ''
    const policyNamespace = policy.metadata.namespace ?? ''
    const policyResponses: Policy[] = policies.filter(
      (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
    )
    const status: ResultsTableData[] = []
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
            timestamp: detail?.history?.[0]?.lastTimestamp ?? new Date().toISOString(),
            policyName,
            policyNamespace,
            remediationAction: getPolicyTempRemediation(policyResponse, template),
          })
        })
      })
    return status
  }, [policy, policies])

  const columns = useMemo(
    () => [
      {
        header: t('Cluster'),
        sort: 'cluster',
        cell: (item: ResultsTableData) => (
          <Link
            to={{
              pathname: generatePath(NavigationPath.clusterOverview, {
                name: item.cluster,
                namespace: item.clusterNamespace || UNKNOWN_NAMESPACE,
              }),
            }}
          >
            {item.cluster}
          </Link>
        ),
        search: (item: ResultsTableData) => item.cluster,
        exportContent: (item: ResultsTableData) => item.cluster,
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
        cell: (item: ResultsTableData) => {
          const message = item.message ?? '-'
          let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
          compliant = compliant ? compliant.trim().toLowerCase() : '-'
          switch (compliant) {
            case 'compliant':
              return (
                <div>
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('No violations')}
                </div>
              )
            case 'noncompliant':
              return (
                <div style={{ width: 'max-content' }}>
                  <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                  <div style={{ display: 'inline' }}> {t('Violations')}</div>
                  {message.includes('found but not as specified') && <ViewDiffApiCall {...{ item }} />}
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
        exportContent: (item: ResultsTableData): string => {
          const message = item.message ?? '-'
          let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
          compliant = compliant ? compliant.trim().toLowerCase() : '-'
          switch (compliant) {
            case 'compliant':
              return t('No violations')
            case 'noncompliant':
              return t('Violations')
            case 'pending':
              return t('Pending')
            default:
              return t('No status')
          }
        },
      },
      {
        header: t('Template'),
        sort: 'templateName',
        cell: (item: ResultsTableData) => {
          const templateDetailURL = getTemplateDetailURL(item)
          const displayTemplate = templateDetailURL ? (
            <span>
              <Link to={templateDetailURL}>{item.templateName}</Link>
            </span>
          ) : (
            item.templateName
          )

          return canCreatePolicy ? (
            displayTemplate
          ) : (
            <Tooltip content={t('rbac.unauthorized')}>
              <span className="link-disabled" id="template-name-link-disabled">
                {item.templateName}
              </span>
            </Tooltip>
          )
        },
        search: (item: ResultsTableData) => item.templateName,
        exportContent: (item: ResultsTableData) => item.templateName,
      },
      {
        header: t('Message'),
        sort: 'message',
        cell: (item: ResultsTableData) => {
          const policyName = item?.policyName
          const policyNamespace = item?.policyNamespace
          const cluster = item?.cluster
          const templateName = item?.templateName
          const apiVersion = item?.apiVersion
          const kind = item?.kind
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
          if (prunedMessage && policyName && policyNamespace && cluster && templateName && apiVersion && kind) {
            const templateDetailURL = getTemplateDetailURL(item)
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
        search: (item: ResultsTableData) => item.message,
        exportContent: (item: ResultsTableData) => {
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart() || '-'
          return prunedMessage
        },
      },
      {
        header: t('Remediation'),
        sort: 'remediationAction',
        cell: (item: ResultsTableData) => item.remediationAction,
        search: (item: ResultsTableData) => item.remediationAction,
        exportContent: (item: ResultsTableData) => item.remediationAction,
      },
      {
        header: t('Last report'),
        sort: 'timestamp',
        cell: (item: ResultsTableData) => {
          const timestamp = item.timestamp
          const formattedTimestamp = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
          return formattedTimestamp && fromNow(formattedTimestamp)
        },
        exportContent: (item: ResultsTableData) => {
          const timestamp = item.timestamp
          const formattedTimestamp = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
          return formattedTimestamp && fromNow(formattedTimestamp)
        },
      },
      {
        header: t('History'),
        cell: (item: ResultsTableData) => {
          const policyName = item?.policyName
          const policyNamespace = item?.policyNamespace
          const cluster = item?.cluster
          const templateName = item?.templateName
          if (policyName && policyNamespace && cluster && templateName) {
            const statusHistoryURL = generatePath(NavigationPath.policyDetailsHistory, {
              namespace: policyNamespace,
              name: policyName,
              clusterName: cluster,
              templateName,
            })
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
        <AcmTable<ResultsTableData>
          showExportButton
          exportFilePrefix={`${policy.metadata.name}-${policy.metadata.namespace}`}
          items={policiesDeployedOnCluster}
          emptyState={
            <AcmEmptyState
              title={t('No cluster results')}
              message={t('No clusters are reporting status for this policy.')}
            />
          }
          columns={columns}
          keyFn={(item) => `${item.cluster}.${item.templateName}`}
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
