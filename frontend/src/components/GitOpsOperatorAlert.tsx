/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../lib/acm-i18next'
import { OperatorAlert } from './OperatorAlert'

export function GitOpsOperatorAlert(props: { showAlert: boolean; className?: string }) {
  const { showAlert, className } = props

  const { t } = useTranslation()
  const component = 'alert'
  const message = t('OpenShift GitOps Operator is required to create ApplicationSets.')
  const operatorName = 'Red Hat OpenShift GitOps'

  return <>{showAlert && <OperatorAlert {...{ component, message, operatorName, className }} />}</>
}
