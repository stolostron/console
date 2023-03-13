/* Copyright Contributors to the Open Cluster Management project */

import { Button, ModalVariant } from '@patternfly/react-core'
import { AcmModal, AcmToastContext } from '../../../ui-components'
import { TFunction } from 'i18next'
import _ from 'lodash'
import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { IResource, reconcileResources, Subscription } from '../../../resources'
export interface ISyncResourceModalProps {
  close: () => void
  open: boolean
  resources: IResource[]
  t: TFunction
  subscriptions: Subscription[]
}

export function SyncResourceModal(props: ISyncResourceModalProps | { open: false }) {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  if (props.open === false) {
    return <></>
  }

  const handleSubmit = () => {
    props.close()
    const { subscriptions } = props
    const existingResources: any[] = []
    const subNames: (string | undefined)[] = []
    props.resources.forEach((sub) => {
      subNames.push(sub.metadata?.name)
      const annotations = _.get(sub, 'metadata.annotations', {})
      annotations['apps.open-cluster-management.io/manual-refresh-time'] = new Date()
      const existingSubscription = subscriptions.find(
        (s) => s.metadata.name === sub?.metadata?.name && s.metadata.namespace === sub?.metadata?.namespace
      )
      existingResources.push(existingSubscription)
    })

    reconcileResources(props.resources, existingResources).then(() => {
      toastContext.addAlert({
        title: t('Subscription updated'),
        message: t('{{names}} were successfully synced.', { name: subNames.join(', ') }),
        type: 'success',
        autoClose: true,
      })
    })
  }

  const modalTitle = t('Sync application')
  return (
    <AcmModal
      id="remove-resource-modal"
      isOpen={props.open}
      title={modalTitle}
      aria-label={modalTitle}
      showClose={true}
      onClose={props.close}
      variant={ModalVariant.large}
      position="top"
      actions={[
        <Button key="confirm" variant="primary" onClick={() => handleSubmit()}>
          {t('Synchronize')}
        </Button>,
        <Button key="cancel" variant="link" onClick={props.close}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      {t('Synchronize application resources with the source repository.')}
    </AcmModal>
  )
}
