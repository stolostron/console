/* Copyright Contributors to the Open Cluster Management project */
import { Alert, AlertVariant, Button } from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'
import { Link } from 'react-router-dom-v5-compat'

import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'

export function OperatorAlert(props: {
  component: 'hint' | 'alert'
  message: string
  operatorName: string
  isUpgrade?: boolean
  className?: string
  title?: string
  actionLinks?: ReactNode
}) {
  const { component, message, operatorName, isUpgrade, className, actionLinks } = props

  const { t } = useTranslation()

  const title = props.title || (isUpgrade ? t('Operator upgrade required') : t('Operator required'))

  const linkTarget = isUpgrade
    ? '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion'
    : `/operatorhub/all-namespaces?keyword=${encodeURIComponent(operatorName)}`
  const link = actionLinks || (
    <Link to={linkTarget} target={'_blank'}>
      <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
        {isUpgrade ? t('View installed operators') : t('Install the operator')}
      </Button>
    </Link>
  )

  return component === 'hint' ? (
    <Alert className={className} isInline title={title} actionLinks={link} variant={AlertVariant.info}>
      {message}
    </Alert>
  ) : (
    <Alert className={className} isInline title={title} actionLinks={link} variant={AlertVariant.danger}>
      {message}
    </Alert>
  )
}
