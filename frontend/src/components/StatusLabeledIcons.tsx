/* Copyright Contributors to the Open Cluster Management project */

import { Flex, FlexItem, Stack } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'

export function StatusLabeledIcons(props: {
  compliant?: number
  compliantStatus: string
  compliantSubtitle?: string
  violations?: number
  violationStatus: string
  violationSubtitle?: string
  unknown?: number
  unknownStatus: string
  unknownSubtitle?: string
}) {
  const statuses: { key: string; count: number; icon: ReactNode; status: string; subtitle?: string }[] = []

  if (props.violations !== undefined && props.violations) {
    statuses.push({
      key: 'high',
      count: props.violations,
      icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
      status: props.violationStatus,
      subtitle: props.violationSubtitle,
    })
  }

  if (props.compliant !== undefined && props.compliant) {
    statuses.push({
      key: 'ready',
      count: props.compliant,
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
      status: props.compliantStatus,
      subtitle: props.compliantSubtitle,
    })
  }

  if (props.unknown !== undefined && props.unknown) {
    statuses.push({
      key: 'ready',
      count: props.unknown,
      icon: <ExclamationTriangleIcon color="var(--pf-global--icon--Color--light)" />,
      status: props.unknownStatus,
      subtitle: props.unknownSubtitle,
    })
  }

  return (
    <Flex justifyContent={{ default: 'justifyContentSpaceAround' }} style={{ gap: 24 }}>
      {statuses.map(({ key, icon, status, subtitle }) => (
        <Flex key={key}>
          <FlexItem>{icon}</FlexItem>
          <Stack style={{ textAlign: 'left' }}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#">{status}</a>
            {subtitle && <span>{subtitle}</span>}
          </Stack>
        </Flex>
      ))}
    </Flex>
  )
}
