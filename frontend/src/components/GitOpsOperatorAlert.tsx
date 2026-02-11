/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../lib/acm-i18next'
import { OperatorAlert } from './OperatorAlert'

export function GitOpsOperatorAlert(props: {
  showAlert: boolean
  isPullModel: boolean
  className?: string
  editMode?: boolean
}) {
  const { showAlert, className, isPullModel, editMode } = props

  const { t } = useTranslation()
  let message
  let component: 'alert' | 'hint' = 'alert'

  if (showAlert) {
    component = 'alert'
    message = isPullModel
      ? t(
          'The OpenShift Gitops Operator is required on the hub cluster as well as all managed clusters you are targeting to create an application set pull model type.'
        )
      : t('OpenShift GitOps Operator is required to create ApplicationSets.')
  } else if (editMode === false && isPullModel) {
    component = 'hint'
    message = t(
      'The OpenShift GitOps Operator is required on the managed clusters to create an application set pull model type. Make sure the operator is installed on all managed clusters you are targeting.'
    )
  }
  if (!message) return null
  const operatorName = 'Red Hat OpenShift GitOps'

  return <OperatorAlert component={component} message={message} operatorName={operatorName} className={className} />
}
