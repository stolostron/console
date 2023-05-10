/* Copyright Contributors to the Open Cluster Management project */
import { Alert, AlertVariant, Button, Hint, HintBody, HintFooter } from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export function OperatorAlert(props: {
  component: 'hint' | 'alert'
  message: string
  operatorName: string
  isUpgrade?: boolean
  className?: string
}) {
  const { component, message, operatorName, isUpgrade, className } = props

  const { t } = useTranslation()

  const title = isUpgrade ? t('Operator upgrade required') : t('Operator required')

  const linkTarget = isUpgrade
    ? '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion'
    : `/operatorhub/all-namespaces?keyword=${encodeURIComponent(operatorName)}`
  const link = (
    <Link to={linkTarget} target={'_blank'}>
      <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
        {isUpgrade ? t('View installed operators') : t('Install the operator')}
      </Button>
    </Link>
  )

  return component === 'hint' ? (
    <Hint className={className}>
      <HintBody>{message}</HintBody>
      <HintFooter>{link}</HintFooter>
    </Hint>
  ) : (
    <Alert className={className} isInline title={title} actionLinks={link} variant={AlertVariant.danger}>
      {message}
    </Alert>
  )
}
