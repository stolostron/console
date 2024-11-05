/* Copyright Contributors to the Open Cluster Management project */

import { Label, Tooltip } from '@patternfly/react-core'
import { AsleepIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'

export function TemplateDetailTitle({
  policyKind,
  templateName,
  compliant,
  auditViolations,
}: Readonly<{ policyKind?: string; templateName: string; compliant: string; auditViolations?: number }>) {
  const { t } = useTranslation()

  const short = useMemo(() => {
    let newStr = ''
    if (policyKind) {
      for (const element of policyKind) {
        if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(element)) {
          newStr += element
        }
      }
    }

    if (newStr == '') {
      return ''
    }

    return (
      <Tooltip content={policyKind}>
        <span
          style={{
            padding: '1px 4px',
            backgroundColor: '#009596',
            color: 'var(--pf-global--BackgroundColor--light-100)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            marginRight: '10px',
          }}
        >
          {newStr}
        </span>
      </Tooltip>
    )
  }, [policyKind])

  const badgeCompliant = useMemo(() => {
    if (['ClusterPolicy', 'Policy'].includes(policyKind || '') && auditViolations !== undefined) {
      return auditViolations > 0 ? (
        <Label color="red" icon={<ExclamationCircleIcon />} style={{ verticalAlign: 'middle' }}>
          {t('Audit violations')}{' '}
          <span
            style={{
              backgroundColor: 'var(--pf-c-label__icon--Color)',
              borderRadius: 10,
              marginLeft: 8,
              fontSize: '0.75rem',
              padding: '0 6px',
              paddingTop: 2,
              color: 'var(--pf-global--BackgroundColor--100)',
            }}
          >
            {auditViolations}{' '}
          </span>
        </Label>
      ) : (
        <Label color="green" icon={<CheckCircleIcon />} style={{ verticalAlign: 'middle' }}>
          {t('No audit violations')}
        </Label>
      )
    }
    switch (compliant) {
      case 'NonCompliant':
        return (
          <Label color="red" icon={<ExclamationCircleIcon />} style={{ verticalAlign: 'middle' }}>
            {t('Violations')}
          </Label>
        )
      case 'Compliant':
        return (
          <Label color="green" icon={<CheckCircleIcon />} style={{ verticalAlign: 'middle' }}>
            {t('No violations')}
          </Label>
        )
      case 'UnknownCompliancy':
        return (
          <Label
            color="orange"
            icon={
              <ExclamationTriangleIcon
                color="var(--pf-global--warning-color--100)"
                style={{ verticalAlign: 'middle' }}
              />
            }
          >
            {compliant}
          </Label>
        )
      case 'Terminating':
        return (
          <Label color="purple" icon={<AsleepIcon />} style={{ verticalAlign: 'middle' }}>
            {compliant}
          </Label>
        )
      default:
        return ''
    }
  }, [auditViolations, compliant, policyKind, t])

  return (
    <>
      {short}
      <span style={{ marginRight: '10px' }}>{templateName}</span>
      {badgeCompliant}
    </>
  )
}
