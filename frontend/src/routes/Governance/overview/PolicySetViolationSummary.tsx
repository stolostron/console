/* Copyright Contributors to the Open Cluster Management project */
import { Card } from '@patternfly/react-core'
import { AcmDonutChart, colorThemes } from '../../../ui-components'
import { useMemo } from 'react'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'

export function PolicySetViolationsCard() {
  const violations = usePolicySetViolations()
  const { t } = useTranslation()
  return (
    <ViolationsCard
      title={t('Policy set violations')}
      description={t('Overview of policy set violations')}
      noncompliant={violations.noncompliant}
      compliant={violations.compliant}
      pending={violations.pending}
      unknown={violations.unknown}
    />
  )
}

function usePolicySetViolations() {
  const { policySetsState } = useSharedAtoms()
  const policySets = useRecoilValue(policySetsState)
  const violations = useMemo(() => {
    let compliant = 0
    let noncompliant = 0
    let pending = 0
    let unknown = 0
    for (const policySet of policySets) {
      switch (policySet.status?.compliant) {
        case 'Compliant':
          compliant++
          break
        case 'NonCompliant':
          noncompliant++
          break
        case 'Pending':
          pending++
          break
        default:
          unknown++
          break
      }
    }
    return { noncompliant, compliant, pending, unknown }
  }, [policySets])
  return violations
}

export function ViolationsCard(props: {
  title: string
  description: string
  noncompliant: number
  compliant: number
  pending: number
  unknown?: number
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <AcmDonutChart
        title={props.title}
        description={props.description}
        donutLabel={{
          title: props.noncompliant.toString(),
          subTitle: t('Violation', { count: props.noncompliant }),
        }}
        data={[
          {
            key: t('with violations', { count: props.noncompliant }),
            value: props.noncompliant,
            isPrimary: true,
            useForTitleCount: true,
            link: props.noncompliant > 0 ? `${NavigationPath.policySets}?violation=violations` : undefined,
          },
          {
            key: t('pending'),
            value: props.pending,
            link: props.pending > 0 ? `${NavigationPath.policySets}?violation=pending` : undefined,
          },
          {
            key: t('with no violations'),
            value: props.compliant,
            link: props.compliant > 0 ? `${NavigationPath.policySets}?violation=no-violations` : undefined,
          },
        ]}
        colorScale={colorThemes.criticalLowSuccess}
      />
    </Card>
  )
}
