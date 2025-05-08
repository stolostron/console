/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { TFunction } from 'react-i18next'
import { useTranslation } from '../../../../lib/acm-i18next'
import { fetchRetry, getBackendUrl } from '../../../../resources/utils'
import { AcmButton, AcmModal, AcmToastContext, IAlertContext } from '../../../../ui-components'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SnapshotModalBody } from './snapshotModalBody'
import { SnapshotRestoreModalBody } from './SnapshotRestoreModalBody'

export interface IVMActionModalProps {
  open: boolean
  close: () => void
  action: string
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE'
  item: any
  vm?: any // vm yaml needs to be passed for some actions because modal does not always have context of the specific vm
}

export const ClosedVMActionModalProps: IVMActionModalProps = {
  open: false,
  close: () => {},
  action: '',
  method: 'PUT',
  item: {},
}

export function handleVMActions(
  action: string,
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE',
  item: any,
  reqBody: any,
  refetchVM: () => void, // Callback fn to refetch the vm after action
  toast: IAlertContext,
  t: TFunction
) {
  const abortController = new AbortController()

  let subResourceKind = undefined
  let path = ''
  switch (action.toLowerCase()) {
    case 'start':
    case 'stop':
    case 'restart':
      subResourceKind = 'virtualmachines'
      path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/${subResourceKind}/${item.name}/${action.toLowerCase()}`
        : `/${subResourceKind}/${action.toLowerCase()}`
      break
    case 'pause':
    case 'unpause':
      subResourceKind = 'virtualmachineinstances'
      path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/${subResourceKind}/${item.name}/${action.toLowerCase()}`
        : `/${subResourceKind}/${action.toLowerCase()}`
      break
    case 'snapshot':
      subResourceKind = 'virtualmachinesnapshots'
      path = item?._hubClusterResource
        ? `/apis/snapshot.kubevirt.io/v1beta1/namespaces/${item.namespace}/${subResourceKind}`
        : `/${subResourceKind}`
      break
    case 'restore':
      subResourceKind = 'virtualmachinerestores'
      path = item?._hubClusterResource
        ? `/apis/snapshot.kubevirt.io/v1beta1/namespaces/${item.namespace}/${subResourceKind}`
        : `/${subResourceKind}`
      break
  }

  let body = reqBody
  if (!item?._hubClusterResource) {
    body = { reqBody, managedCluster: item.cluster, vmName: item.name, vmNamespace: item.namespace }
  }

  fetchRetry({
    method,
    url: `${getBackendUrl()}${path}`,
    data: body,
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

      const errMessage: string = err?.message ?? t('An unexpected error occurred.')
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

function WarningBody(props: Readonly<{ action: string; item: any }>) {
  const { t } = useTranslation()
  const { action, item } = props
  return (
    <div style={{ paddingTop: '1rem' }}>
      {t('Are you sure you want to {{action}} {{vmName}} in namespace {{vmNamespace}}?', {
        action: action.toLowerCase(),
        vmName: item.name,
        vmNamespace: item.namespace,
      })}
    </div>
  )
}

export const VMActionModal = (props: IVMActionModalProps) => {
  const { open, close, action, method, item, vm } = props
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const [reqBody, setReqBody] = useState({})
  const [getVMError, setGetVMError] = useState<string | undefined>()

  let modalBody = undefined
  switch (action.toLowerCase()) {
    case 'start':
    case 'stop':
    case 'restart':
    case 'pause':
    case 'unpause':
      modalBody = <WarningBody action={action} item={item} />
      break
    case 'snapshot':
      modalBody = (
        <SnapshotModalBody
          item={item}
          setSnapshotReqBody={setReqBody}
          getVMError={getVMError}
          setGetVMError={setGetVMError}
        />
      )
      break
    case 'restore':
      modalBody = <SnapshotRestoreModalBody item={item} vm={vm} setSnapshotRestoreReqBody={setReqBody} />
      break
    default:
      modalBody = <WarningBody action={action} item={item} />
  }

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
          id="vm-modal-confirm"
          isDisabled={!!getVMError}
          key="confirm"
          onClick={() => {
            handleVMActions(
              action,
              method,
              item,
              reqBody,
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
      {modalBody}
    </AcmModal>
  )
}
