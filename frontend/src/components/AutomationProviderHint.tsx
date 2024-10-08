/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedSelectors } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { coerce, gte } from 'semver'
import { OperatorAlert } from './OperatorAlert'
import { SupportedOperator, useOperatorCheck } from '../lib/operatorCheck'

const WORKFLOW_SUPPORT_VERSION = '2.2.1'

export function AutomationProviderHint(props: {
  component: 'hint' | 'alert'
  className?: string
  /**
   * Indicates the hint is being used for policy automation rather than automation templates. */
  policyAutomation?: boolean
  /**
   * Indicates no hint is required when the operator is not installed, but an upgrade hint may be displayed if workflow support is required and not met.
   * Useful if a hint is already visible but the user is about to add an automation template that requires workflow job templates. */
  operatorNotRequired?: boolean
  /** Indicates whether to show an upgrade notice if installed operator version does not support workflow job templates.
   * If not defined, defaults to true when any automation template uses workflow job templates. */
  workflowSupportRequired?: boolean
}) {
  const { ansibleOperatorSubscriptionsValue, clusterCuratorSupportedCurationsValue, clusterCuratorTemplatesValue } =
    useSharedSelectors()
  const ansibleOperator = useOperatorCheck(SupportedOperator.ansible, ansibleOperatorSubscriptionsValue)
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
    policyAutomation,
    operatorNotRequired,
    workflowSupportRequired = !policyAutomation && workflowJobTemplatesInUse,
  } = props
  const showInstallPrompt = !(ansibleOperator.installed || operatorNotRequired)
  let workflowSupported = false
  try {
    const version = coerce(ansibleOperator.version)
    workflowSupported = !!(version && gte(version, WORKFLOW_SUPPORT_VERSION))
  } catch {
    // assume too old; workflow job templates not supported
  }
  const showUpgradePrompt =
    ansibleOperator.installed && workflowSupportRequired && !showInstallPrompt && !workflowSupported

  const { t } = useTranslation()
  let message = ''

  if (showInstallPrompt) {
    message = policyAutomation
      ? t('ansible.operator.requirements.policy', { version: WORKFLOW_SUPPORT_VERSION })
      : t('ansible.operator.requirements', { version: WORKFLOW_SUPPORT_VERSION })
  } else if (showUpgradePrompt) {
    message = t('ansible.operator.requirements.workflow', { version: WORKFLOW_SUPPORT_VERSION })
  }
  const operatorName = 'Ansible Automation Platform'

  return (
    <>
      {!ansibleOperator.pending && (showInstallPrompt || showUpgradePrompt) && (
        <OperatorAlert {...{ component, message, operatorName, className }} isUpgrade={showUpgradePrompt} />
      )}
    </>
  )
}
