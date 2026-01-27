/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ButtonVariant } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { useContext, useEffect, useState } from 'react'
import { TFunction } from 'react-i18next'
import { useTranslation } from '../../../../lib/acm-i18next'
import { IResource } from '../../../../resources'
import { fetchRetry, getBackendUrl, getRequest } from '../../../../resources/utils'
import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
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
  let name = item.name
  let path = ''
  switch (action.toLowerCase()) {
    case 'start':
    case 'stop':
    case 'restart':
      path = `/virtualmachines/${action.toLowerCase()}`
      break
    case 'pause':
    case 'unpause':
      path = `/virtualmachineinstances/${action.toLowerCase()}`
      break
    case 'snapshot':
      name = item.kind === 'VirtualMachineSnapshot' ? item.sourceName : item.name
      path = `/virtualmachinesnapshots/create`
      break
    case 'restore':
      name = item.kind === 'VirtualMachineSnapshot' ? item.sourceName : item.name
      path = `/virtualmachinerestores`
      break
    case 'delete':
      // need the plural kind either virtualmachines || virtualmachinesnapshots
      path = `/${item.kind.toLowerCase()}s/delete`
      break
  }

  fetchRetry({
    method,
    url: `${getBackendUrl()}${path}`,
    data: { reqBody, managedCluster: item.cluster, vmName: name, vmNamespace: item.namespace },
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
        title: t('Error triggering action {{action}} on {{itemKind}} {{name}}', {
          name: item.name,
          itemKind: item.kind,
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
  const { open, close, action, method, item } = props
  const { t } = useTranslation()
  const toast = useContext(AcmToastContext)
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const [vm, setVM] = useState<any>({})
  const [vmLoading, setVMLoading] = useState<any>(true)
  const [reqBody, setReqBody] = useState({})
  const [getVMError, setGetVMError] = useState<boolean>()

  useEffect(() => {
    if (item.kind === 'VirtualMachineSnapshot' && item.sourceName) {
      const name = item.kind === 'VirtualMachineSnapshot' ? item.sourceName : item.name
      if (isFineGrainedRbacEnabled) {
        const url = getBackendUrl() + `/virtualmachines/get/${item.cluster}/${name}/${item.namespace}` // need the plural kind either virtualmachines || virtualmachinesnapshots
        getRequest<IResource>(url)
          .promise.then((response) => {
            setVMLoading(false)
            setVM(response)
          })
          .catch((err) => {
            setVMLoading(false)
            console.error('Error getting VM resource: ', err)
          })
      } else {
        fleetResourceRequest('GET', item.cluster, {
          apiVersion: 'kubevirt.io/v1',
          kind: 'VirtualMachine',
          name,
          namespace: item.namespace,
        })
          .then((res) => {
            setVMLoading(false)
            if ('errorMessage' in res) {
              console.error(`Error fetching parent VM: ${res.errorMessage}`)
            } else {
              setVM(res)
            }
          })
          .catch((err) => {
            console.error('Error getting VirtualMachine: ', err)
            setVMLoading(false)
          })
      }
    } else {
      setVMLoading(false)
    }
  }, [item, isFineGrainedRbacEnabled])

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
      title={t('{{action}} {{itemKind}}?', { action, itemKind: item.kind })}
      titleIconVariant={'warning'}
      onClose={close}
      actions={[
        <AcmButton
          id="vm-modal-confirm"
          isDisabled={getVMError || vmLoading}
          key="confirm"
          onClick={() => {
            handleVMActions(
              action,
              method,
              item,
              reqBody,
              /* istanbul ignore next */
              () => searchClient.refetchQueries({ include: ['searchResultItems', 'searchResultRelatedItems'] }),
              toast,
              t
            )
            close()
          }}
        >
          {(() => {
            switch (action.toLowerCase()) {
              case 'start':
                return t('Start')
              case 'stop':
                return t('Stop')
              case 'restart':
                return t('Restart')
              case 'pause':
                return t('Pause')
              case 'unpause':
                return t('Unpause')
              case 'snapshot':
                return t('Snapshot')
              case 'restore':
                return t('Restore')
              case 'delete':
                return t('Delete')
            }
          })()}
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
