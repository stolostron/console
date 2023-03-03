/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import moment from 'moment'
import { useMemo } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Policy, PolicyStatusDetails } from '../../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import { AcmEmptyState, AcmTable, AcmTablePaginationContextProvider, compareStrings } from '../../../../ui-components'

interface HistoryTableData {
  message: string
  timestamp: moment.MomentInput
}

export function PolicyDetailsHistory(props: {
  policyName: string
  policyNamespace: string
  clusterName: string
  templateName: string
}) {
  const { t } = useTranslation()
  const { policiesState } = useSharedAtoms()
  const { policyName, policyNamespace, clusterName, templateName } = props
  const [policies] = useRecoilState(policiesState)

  const statusItems: HistoryTableData[] = useMemo(() => {
    if (!(policyName && policyNamespace && clusterName && templateName)) {
      return []
    }
    const policyResponse = policies.find(
      (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}` && p.metadata.namespace === clusterName
    )
    const statuses: HistoryTableData[] = []
    ;(policyResponse?.status?.details ?? [])
      .filter((detail) => detail?.templateMeta?.name === templateName)
      .forEach((detail: PolicyStatusDetails) => {
        const history = detail.history ?? []
        history.forEach((status) => {
          statuses.push({
            message: status.message ?? '-',
            timestamp: status.lastTimestamp ?? '-',
          })
        })
      })
    return statuses
  }, [policyName, policyNamespace, clusterName, templateName, policies])

  const columns = useMemo(
    () => [
      {
        header: 'Violations',
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
        header: 'Message',
        cell: (item: any) => {
          const prunedMessage = item?.message.split(';').slice(1).join(';').trimStart()
          return prunedMessage ? prunedMessage : '-'
        },
        search: (item: any) => item.message,
      },
      {
        header: 'Last report',
        sort: 'timestamp',
        cell: (item: any) => (item.timestamp ? moment(item.timestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow() : '-'),
      },
    ],
    [t]
  )

  return (
    <PageSection>
      <Title headingLevel="h3">{clusterName}</Title>
      <Title headingLevel="h4">{t('Template: {{templateName}}', { templateName })}</Title>
      <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
        <AcmTable<HistoryTableData>
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
      </AcmTablePaginationContextProvider>
    </PageSection>
  )
}
