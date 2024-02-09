/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../lib/acm-i18next'
import { OperatorAlert } from './OperatorAlert'

export function GitOpsOperatorAlert(props: { showAlert: boolean; isPullModel: boolean; className?: string }) {
  const { showAlert, className, isPullModel } = props

  const { t } = useTranslation()
  const component = 'alert'
  const message = isPullModel
    ? t(
        'The OpenShift Gitops Operator is required on the hub cluster as well as all managed clusters you are targeting to create an application set pull model type.'
      )
    : t('OpenShift GitOps Operator is required to create ApplicationSets.')
  const operatorName = 'Red Hat OpenShift GitOps'

  return <>{showAlert && <OperatorAlert {...{ component, message, operatorName, className }} />}</>
}
