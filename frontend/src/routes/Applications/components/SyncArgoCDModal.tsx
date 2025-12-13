/* Copyright Contributors to the Open Cluster Management project */

import { Button } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { useContext, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { IResource } from '../../../resources'
import { patchResource } from '../../../resources/utils'
import { AcmModal, AcmToastContext } from '../../../ui-components'

const refreshAppK8s = async (application: any) => {
  // Check if this is an ApplicationSet (has appSetApps) or a single Application
  const isApplicationSet = application.appSetApps && application.appSetApps.length > 0

  // Determine which apps to sync
  const appsToRefresh: IResource[] = isApplicationSet ? application.appSetApps : [application.app]

  return Promise.all(
    appsToRefresh.map((app: IResource) => {
      const patchData = {
        operation: {
          info: [
            {
              name: 'Reason',
              value: 'Initiated by user in Openshift Console',
            },
          ],
          initiatedBy: {
            automated: false,
            username: 'OpenShift-Console',
          },
          sync: {
            ...(app as any).spec?.syncPolicy,
          },
        },
      }
      return patchResource(app, patchData).promise
    })
  )
}

export interface ISyncArgoCDModalProps {
  close: () => void
  open: boolean
  appOrAppSet: any
}

export function SyncArgoCDModal(props: ISyncArgoCDModalProps | { open: false }) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)
  const [isSyncing, setIsSyncing] = useState(false)

  if (props.open === false) {
    return <></>
  }

  const handleSubmit = async () => {
    setIsSyncing(true)
    try {
      await refreshAppK8s(props.appOrAppSet)
      toastContext.addAlert({
        title: t('ArgoCD app sync initiated'),
        message: t('{{name}} sync has been successfully initiated.', {
          name: props.appOrAppSet.metadata?.name,
        }),
        type: 'success',
        autoClose: true,
      })
      props.close()
    } catch (error) {
      console.error('Failed to initiate ArgoCD app sync:', error)
      toastContext.addAlert({
        title: t('Failed to initiate sync'),
        message: t('Failed to initiate sync of {{name}}. Please try again.', {
          name: props.appOrAppSet.metadata?.name,
        }),
        type: 'danger',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const isApplicationSet = props.appOrAppSet.appSetApps && props.appOrAppSet.appSetApps.length > 0
  const modalTitle = t('Initiate sync for ArgoCD application')
  const modalDescription = isApplicationSet
    ? t('Initiate synchronization of all applications in the ApplicationSet with their source repositories.')
    : t('Initiate synchronization of application resources with the source repository.')

  return (
    <AcmModal
      id="sync-argocd-modal"
      isOpen={props.open}
      title={modalTitle}
      aria-label={modalTitle}
      showClose={true}
      onClose={props.close}
      variant={ModalVariant.medium}
      position="top"
      actions={[
        <Button key="confirm" variant="primary" onClick={handleSubmit} isDisabled={isSyncing} isLoading={isSyncing}>
          {t('Synchronize')}
        </Button>,
        <Button key="cancel" variant="link" onClick={props.close} isDisabled={isSyncing}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      {modalDescription}
    </AcmModal>
  )
}
