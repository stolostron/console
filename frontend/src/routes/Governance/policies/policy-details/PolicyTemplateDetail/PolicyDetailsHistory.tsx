/* Copyright Contributors to the Open Cluster Management project */

import { Icon, PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Policy, PolicyStatusDetails } from '../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmEmptyState, AcmTable, AcmTableStateProvider, compareStrings } from '../../../../../ui-components'
import { getISOStringTimestamp } from '../../../../../resources/utils'
import AcmTimestamp from '../../../../../lib/AcmTimestamp'
import { useParams } from 'react-router-dom-v5-compat'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'

interface HistoryTableData {
  message: string
  timestamp: string
  index: number
}

export function PolicyDetailsHistory() {
  const { t } = useTranslation()
  const { policiesState } = useSharedAtoms()
  const urlParams = useParams()
  const policyName = urlParams.name ?? ''
  const policyNamespace = urlParams.namespace ?? ''
  const clusterName = urlParams.clusterName ?? ''
  const templateName = urlParams.templateName ?? ''

  const policies = useRecoilValue(policiesState)
  const { template } = useTemplateDetailsContext()

  const statusItems: HistoryTableData[] = useMemo(() => {
    let policyResponse
    const statuses: HistoryTableData[] = []

    // Policies have more history than the template
    if (policyName && policyNamespace && clusterName && templateName) {
      // policy kind
      policyResponse = policies.find(
        (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}` && p.metadata.namespace === clusterName
      )
      ;(policyResponse?.status?.details ?? [])
        .filter((detail) => detail?.templateMeta?.name === templateName)
        .forEach((detail: PolicyStatusDetails) => {
          const history = detail.history ?? []
          let i = 0
          history.forEach((status) => {
            statuses.push({
              message: status.message ?? '-',
              timestamp: status.lastTimestamp ?? '-',
              index: i--, // decrement to make the sort work by default
            })
          })
        })
    } else if (templateName && clusterName && template?.status?.history) {
      // reuse the policy from the template
      let i = 0
      ;(template?.status?.history ?? []).forEach((history: any) => {
        statuses.push({
          message: history.message ?? '-',
          timestamp: history.lastTimestamp ?? '-',
          index: i--, // decrement to make the sort work by default
        })
      })
    }

    return statuses
  }, [policyName, policyNamespace, clusterName, templateName, policies, template])

  const columns = useMemo(
    () => [
      {
        header: t('Violations'),
        sort: (itemA: any, itemB: any) => {
          const messageA = itemA.message ?? '-'
          const compliantA = messageA && typeof messageA === 'string' ? messageA.split(';')[0] : '-'
          const messageB = itemB.message ?? '-'
          const compliantB = messageB && typeof messageB === 'string' ? messageB.split(';')[0] : '-'
          return compareStrings(compliantA, compliantB)
        },
        cell: (item: any) => {
          const message = item.message ?? '-'
          let compliant = message && typeof message === 'string' ? message.split(';')[0] : '-'
          compliant = compliant ? compliant.trim().toLowerCase() : '-'
          switch (compliant) {
            case 'compliant':
              return (
                <div>
                  <Icon status="success">
                    <CheckCircleIcon />
                  </Icon>{' '}
                  {t('No violations')}
                </div>
              )
            case 'noncompliant':
              return (
                <div>
                  <Icon status="danger">
                    <ExclamationCircleIcon />
                  </Icon>{' '}
                  {t('Violations')}
                </div>
              )
            case 'pending':
              return (
                <div>
                  <Icon status="warning">
                    <ExclamationTriangleIcon />
                  </Icon>{' '}
                  {t('Pending')}
                </div>
              )
            default:
              return (
                <div>
                  <Icon status="warning">
                    <ExclamationTriangleIcon />
                  </Icon>{' '}
                  {t('No status')}
                </div>
              )
          }
        },
        exportContent: (item: any): string => {
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
        header: t('Message'),
        cell: (item: any) => {
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart() || '-'
          return prunedMessage
        },
        search: (item: any) => item.message,
        exportContent: (item: any) => {
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
          return prunedMessage ? prunedMessage : '-'
        },
      },
      {
        header: t('Last report'),
        sort: 'index',
        cell: (item: any) => <AcmTimestamp timestamp={item.timestamp} />,
        exportContent: (item: any) => {
          if (item.timestamp) {
            return getISOStringTimestamp(item.timestamp)
          }
        },
      },
    ],
    [t]
  )

  return (
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h3">{clusterName}</Title>
      <Title headingLevel="h4">{t('Template: {{templateName}}', { templateName })}</Title>
      <AcmTableStateProvider localStorageKey="grc-status-view">
        <AcmTable<HistoryTableData>
          showExportButton
          exportFilePrefix={`${policyName}-${policyNamespace}-${clusterName}-${templateName}`}
          items={statusItems}
          emptyState={
            <AcmEmptyState
              title={t('No history')}
              message={t('There is no history for the policy template on this cluster.')}
            />
          }
          columns={columns}
          keyFn={(item) => `${item.message}.${item.timestamp}`}
          initialSort={{
            index: 2,
            direction: 'desc',
          }}
          fuseThreshold={0}
        />
      </AcmTableStateProvider>
    </PageSection>
  )
}
