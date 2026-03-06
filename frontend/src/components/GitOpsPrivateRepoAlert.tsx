/* Copyright Contributors to the Open Cluster Management project */

import { Alert, AlertVariant, Button } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from '../lib/acm-i18next'
import { processResourceActionLink } from '../routes/Applications/ApplicationDetails/ApplicationTopology/helpers/diagram-helpers'

export function GitOpsPrivateRepoAlert(props: {
  isPullModel: boolean
  namespace: string
  hubClusterName: string
  className?: string
  title?: string
}) {
  const { className, isPullModel, namespace, hubClusterName } = props
  const { t } = useTranslation()
  const title = props.title || t('Private repository credentials required')
  const message = isPullModel
    ? t(
        'When using private repositories, credentials are required on all target managed clusters to create an application set pull model type.'
      )
    : t(
        'When using private repositories, credentials are required on the hub cluster to create an application set push model type.'
      )

  const link = (
    <Button
      variant="link"
      icon={<ExternalLinkAltIcon />}
      iconPosition="right"
      isInline
      onClick={() => {
        processResourceActionLink(
          { action: 'open_argo_repo_settings', namespace, cluster: hubClusterName },
          () => {},
          t,
          hubClusterName
        )
      }}
    >
      {t('Configure repository credentials')}
    </Button>
  )

  return (
    <Alert className={className} isInline title={title} actionLinks={link} variant={AlertVariant.info}>
      {message}
    </Alert>
  )
}
