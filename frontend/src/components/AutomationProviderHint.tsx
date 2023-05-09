/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedSelectors } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { coerce, gte } from 'semver'
import { OperatorAlert } from './OperatorAlert'

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

  const { component, className, operatorNotRequired, workflowSupportRequired = workflowJobTemplatesInUse } = props
  const showInstallPrompt = !(ansibleOperators.length || operatorNotRequired)
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
  const message = showInstallPrompt
    ? t('ansible.operator.requirements', { version: WORKFLOW_SUPPORT_VERSION })
    : t('ansible.operator.requirements.workflow', { version: WORKFLOW_SUPPORT_VERSION })
  const operatorName = 'Ansible Automation Platform'

  return (
    <>
      {(showInstallPrompt || showUpgradePrompt) && (
        <OperatorAlert {...{ component, message, operatorName, className }} isUpgrade={showUpgradePrompt} />
      )}
    </>
  )
}
