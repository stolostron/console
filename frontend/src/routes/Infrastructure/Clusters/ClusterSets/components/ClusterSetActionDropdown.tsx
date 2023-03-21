/* Copyright Contributors to the Open Cluster Management project */

import {
  deleteResource,
  ManagedClusterSet,
  ManagedClusterSetDefinition,
  ResourceErrorCode,
  isGlobalClusterSet,
} from '../../../../../resources'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../components/BulkActionModal'
import { RbacDropdown } from '../../../../../components/Rbac'
import { rbacCreate, rbacDelete } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterStatuses } from './ClusterStatuses'
import { ManagedClusterSetBindingModal } from './ManagedClusterSetBindingModal'

export function ClusterSetActionDropdown(props: { managedClusterSet: ManagedClusterSet; isKebab?: boolean }) {
  const { t } = useTranslation()
  const history = useHistory()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ManagedClusterSet> | { open: false }>({
    open: false,
  })

  const [showManagedClusterSetBindingModal, setShowManagedClusterSetBindingModal] = useState<boolean>(false)

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (managedClusterSet: ManagedClusterSet) => (
          <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
        ),
        sort: 'name',
      },
      {
        header: t('table.cluster.statuses'),
        sort: 'status',
        cell: (managedClusterSet: ManagedClusterSet) => <ClusterStatuses managedClusterSet={managedClusterSet} />,
      },
    ],
    [t]
  )

  const actions = useMemo(() => {
    let actions = [
      {
        id: 'edit-bindings',
        text: t('set.edit-bindings'),
        click: () => setShowManagedClusterSetBindingModal(true),
        isAriaDisabled: true,
        rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'bind')],
      },
      {
        id: 'manage-clusterSet-resources',
        text: t('set.manage-resources'),
        click: (managedClusterSet: ManagedClusterSet) => {
          history.push(NavigationPath.clusterSetManage.replace(':id', managedClusterSet.metadata.name!))
        },
        isAriaDisabled: true,
        rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'join')],
      },
      {
        id: 'delete-clusterSet',
        text: t('set.delete'),
        click: (managedClusterSet: ManagedClusterSet) => {
          setModalProps({
            open: true,
            isDanger: true,
            icon: 'warning',
            title: t('bulk.title.deleteSet'),
            action: t('delete'),
            processing: t('deleting'),
            items: [managedClusterSet],
            emptyState: undefined, // there is always 1 item supplied
            description: t('bulk.message.deleteSet'),
            columns: modalColumns,
            keyFn: (managedClusterSet) => managedClusterSet.metadata.name! as string,
            actionFn: deleteResource,
            close: () => {
              setModalProps({ open: false })
            },
            confirmText: managedClusterSet.metadata.name!,
            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
          })
        },
        isAriaDisabled: true,
        rbac: [rbacDelete(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name)],
      },
    ]

    if (isGlobalClusterSet(props.managedClusterSet)) {
      actions = actions.filter((action) => action.id !== 'manage-clusterSet-resources')
      actions = actions.filter((action) => action.id !== 'delete-clusterSet')
    }
    return actions
  }, [history, modalColumns, props.managedClusterSet, t])

  return (
    <>
      <ManagedClusterSetBindingModal
        clusterSet={showManagedClusterSetBindingModal ? props.managedClusterSet : undefined}
        onClose={() => setShowManagedClusterSetBindingModal(false)}
      />
      <BulkActionModal<ManagedClusterSet> {...modalProps} />
      <RbacDropdown<ManagedClusterSet>
        id={`${props.managedClusterSet.metadata.name}-actions`}
        item={props.managedClusterSet}
        isKebab={props.isKebab}
        text={t('actions')}
        actions={actions}
      />
    </>
  )
}
