/* Copyright Contributors to the Open Cluster Management project */

import { Icon, PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  CertificatePolicy,
  ConfigurationPolicy,
  OperatorPolicy,
  Policy,
  PolicyStatusDetails,
} from '../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import {
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
} from '../../../../../ui-components'
import { getISOStringTimestamp } from '../../../../../resources/utils'
import AcmTimestamp from '../../../../../lib/AcmTimestamp'
import { useParams } from 'react-router-dom-v5-compat'

interface HistoryTableData {
  message: string
  timestamp: string
  index: number
}

const CONFIGURATION_POLICY_KIND = 'ConfigurationPolicy'
const OPERATOR_POLICY_KIND = 'OperatorPolicy'
const CERTIFICATE_POLICY_KIND = 'CertificatePolicy'

export function PolicyDetailsHistory() {
  const { t } = useTranslation()
  const { policiesState, configurationPoliciesState, operatorPoliciesState, certificatePoliciesState } =
    useSharedAtoms()
  const urlParams = useParams()
  const policyName = urlParams.name ?? ''
  const policyNamespace = urlParams.namespace ?? ''
  const clusterName = urlParams.clusterName ?? ''
  const templateName = urlParams.templateName ?? ''
  const kind = urlParams.kind ?? ''
  const policies = useRecoilValue(policiesState)
  const configurationPolicies = useRecoilValue(configurationPoliciesState)
  const operatorPolicies = useRecoilValue(operatorPoliciesState)
  const certificatePolicies = useRecoilValue(certificatePoliciesState)

  const statusItems: HistoryTableData[] = useMemo(() => {
    let policyResponse
    let discoveredPolicyResponse
    const statuses: HistoryTableData[] = []

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
    } else if (templateName && clusterName) {
      if (kind === CONFIGURATION_POLICY_KIND) {
        discoveredPolicyResponse = configurationPolicies.find(
          (p: ConfigurationPolicy) => p.metadata.name === templateName && p.metadata.namespace === clusterName
        )
      }
      if (kind === OPERATOR_POLICY_KIND) {
        discoveredPolicyResponse = operatorPolicies.find(
          (p: OperatorPolicy) => p.metadata.name === templateName && p.metadata.namespace === clusterName
        )
      }
      if (kind === CERTIFICATE_POLICY_KIND) {
        discoveredPolicyResponse = certificatePolicies.find(
          (p: CertificatePolicy) => p.metadata.name === templateName && p.metadata.namespace === clusterName
        )
      }
      let i = 0
      ;(discoveredPolicyResponse?.status?.history ?? []).forEach((history) => {
        statuses.push({
          message: history.message ?? '-',
          timestamp: history.lastTimestamp ?? '-',
          index: i--, // decrement to make the sort work by default
        })
      })
    }

    return statuses
  }, [
    policyName,
    policyNamespace,
    clusterName,
    templateName,
    policies,
    configurationPolicies,
    operatorPolicies,
    certificatePolicies,
    kind,
  ])

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
    <PageSection>
      <Title headingLevel="h3">{clusterName}</Title>
      <Title headingLevel="h4">{t('Template: {{templateName}}', { templateName })}</Title>
      <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
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
      </AcmTablePaginationContextProvider>
    </PageSection>
  )
}
