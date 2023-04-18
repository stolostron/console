/* Copyright Contributors to the Open Cluster Management project */
import { Alert, AlertVariant, Button, Hint, HintBody, HintFooter } from '@patternfly/react-core'
import { useRecoilValue, useSharedSelectors } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { coerce, gte } from 'semver'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

const WORKFLOW_SUPPORT_VERSION = '2.2.1'

export function AutomationProviderHint(props: {
  component: 'hint' | 'alert'
  className?: string
  /**
   * Indicates no hint is required when the operator is not installed, but an upgrade hint may be displayed if workflow support is required and not met.
   * Useful if a hint is already visible but the user is about to add an automation template that requires workflow job templates. */
  operatorNotRequired?: boolean
  /** Indicates whether to show an upgrade notice if installed operator version does not support workflow job templates.
   * If not defined, defaults to true when any automation template uses workflow job templates. */
  workflowSupportRequired?: boolean
  notAnsible?: boolean
  message?: string
  operatorName?: string
}) {
  const { ansibleOperatorSubscriptionsValue, clusterCuratorSupportedCurationsValue, clusterCuratorTemplatesValue } =
    useSharedSelectors()
  const ansibleOperators = useRecoilValue(ansibleOperatorSubscriptionsValue)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const clusterCuratorTemplates = useRecoilValue(clusterCuratorTemplatesValue)

  const workflowJobTemplatesInUse = clusterCuratorTemplates.some((template) =>
    supportedCurations.some((curation) =>
      (['prehook', 'posthook'] as const).some((hookType) =>
        template?.spec?.[curation]?.[hookType]?.some((hook) => hook.type === 'Workflow')
      )
    )
  )

  const {
    component,
    className,
    operatorNotRequired,
    workflowSupportRequired = workflowJobTemplatesInUse,
    notAnsible,
    operatorName = 'ansible+automation+platform',
  } = props
  let showInstallPrompt = !(ansibleOperators.length || operatorNotRequired)
  if (notAnsible) {
    showInstallPrompt = !operatorNotRequired
  }
  const showUpgradePrompt =
    !!ansibleOperators.length &&
    workflowSupportRequired &&
    !showInstallPrompt &&
    !ansibleOperators.some((operator) => {
      try {
        const version = coerce(operator?.status?.installedCSV)
        return version && gte(version, WORKFLOW_SUPPORT_VERSION)
      } catch (err) {
        return false // assume too old
      }
    })

  const { t } = useTranslation()

  const title = showInstallPrompt ? t('Operator required') : t('Operator upgrade required')
  let message = ''
  if (showInstallPrompt) {
    if (props.message) {
      message = props.message
    } else {
      message = t('ansible.operator.requirements', { version: WORKFLOW_SUPPORT_VERSION })
    }
  } else {
    message = t('ansible.operator.requirements.workflow', { version: WORKFLOW_SUPPORT_VERSION })
  }

  const linkTarget = showInstallPrompt
    ? `/operatorhub/all-namespaces?keyword=${operatorName}`
    : '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion'
  const link = (
    <Link to={linkTarget} target={'_blank'}>
      <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
        {showInstallPrompt ? t('Install the operator') : t('View installed operators')}
      </Button>
    </Link>
  )

  return (
    <>
      {(showInstallPrompt || showUpgradePrompt) &&
        (component === 'hint' ? (
          <Hint className={className}>
            <HintBody>{message}</HintBody>
            <HintFooter>{link}</HintFooter>
          </Hint>
        ) : (
          <Alert className={className} isInline title={title} actionLinks={link} variant={AlertVariant.danger}>
            {message}
          </Alert>
        ))}
    </>
  )
}
