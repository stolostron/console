/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { useContext } from 'react'
import { TFunction } from 'react-i18next'
import { useTranslation } from '../../../lib/acm-i18next'
import { fetchRetry, getBackendUrl } from '../../../resources/utils'
import { AcmButton, AcmModal, AcmToastContext, IAlertContext } from '../../../ui-components'
import { searchClient } from '../../Search/search-sdk/search-client'

export interface IVMActionModalProps {
  open: boolean
  close: () => void
  action: string
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE'
  item: {
    name: string
    namespace: string
    cluster: string
  }
}

export const ClosedVMActionModalProps: IVMActionModalProps = {
  open: false,
  close: () => {},
  action: '',
  method: 'PUT',
  item: {
    name: '',
    namespace: '',
    cluster: '',
  },
}

export function handleVMActions(
  action: string,
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE',
  item: any,
  body: any,
  refetchVM: () => void, // Callback fn to refetch the vm after action
  toast: IAlertContext,
  t: TFunction
) {
  if (process.env.NODE_ENV === 'test') return
  const abortController = new AbortController()

  const subResourceKind = action.toLowerCase().includes('pause') ? 'virtualmachineinstances' : 'virtualmachines'
  const path = item?._hubClusterResource
    ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/${subResourceKind}/${item.name}/${action.toLowerCase()}`
    : `/${subResourceKind}/${action.toLowerCase()}`

  fetchRetry({
    method: method,
    url: `${getBackendUrl()}${path}`,
    data: {
      managedCluster: item.cluster,
      vmName: item.name,
      vmNamespace: item.namespace,
      body: body || {},
    },
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    headers: { Accept: '*/*' },
    disableRedirectUnauthorizedLogin: true,
  })
    .then(() => {
      // Wait 5 seconds to allow search collector to catch up & refetch search results to update table.
      setTimeout(refetchVM, 5000)
    })
    .catch((err) => {
      console.error(`VirtualMachine: ${item.name} ${action} error. ${err}`)

      let errMessage: string = err?.message ?? t('An unexpected error occurred.')
      if (errMessage.includes(':')) errMessage = errMessage.split(':').slice(1).join(':')
      if (errMessage === 'Unauthorized') errMessage = t('Unauthorized to execute this action.')
      toast.addAlert({
        title: t('Error triggering action {{action}} on VirtualMachine {{name}}', {
          name: item.name,
          action,
        }),
        message: errMessage,
        type: 'danger',
      })
    })
}

export const VMActionModal = (props: IVMActionModalProps) => {
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const { open, close, action, method, item } = props

  return (
    <AcmModal
      id={'vm-action-modal'}
      variant={ModalVariant.medium}
      isOpen={open}
      title={t('{{action}} VirtualMachine?', { action })}
      titleIconVariant={'warning'}
      onClose={close}
      actions={[
        <AcmButton
          // isDisabled={loadingAccessRequest || !canDelete}
          key="confirm"
          variant={ButtonVariant.danger}
          onClick={() => {
            handleVMActions(
              action,
              method,
              item,
              {},
              () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
              toast,
              t
            )
            close()
          }}
        >
          {action}
        </AcmButton>,
        <AcmButton key="cancel" variant={ButtonVariant.secondary} onClick={close}>
          {t('Cancel')}
        </AcmButton>,
      ]}
    >
      <div style={{ paddingTop: '1rem' }}>
        {t('Are you sure you want to {{action}} {{vmName}} in namespace {{vmNamespace}}?', {
          action: action.toLowerCase(),
          vmName: item.name,
          vmNamespace: item.namespace,
        })}
      </div>
    </AcmModal>
  )
}
